import { ok, err, type Result } from 'neverthrow';
import { z } from 'zod';
import { AppError, type AsyncResult } from '@tempot/shared';
import { INPUT_ENGINE_ERRORS } from '../input-engine.errors.js';
import { FIELD_SKIPPED_SENTINEL, type FieldMetadata } from '../input-engine.types.js';
import type { FieldHandler, RenderContext } from '../fields/field.handler.js';
import type { FormRunnerDeps, FormRunnerInput } from './form.runner.js';
import { acknowledgeCallbackResponse } from './callback-response.acknowledger.js';
import {
  logFieldMaxRetries,
  logFieldStarted,
  logFieldValidated,
} from './field.lifecycle-logger.js';
import { handleValidationFailure } from './field-validation.feedback.js';
import { handleControlSignal } from './field-control-signal.handler.js';

const DEFAULT_MAX_RETRIES = 3;

/** Internal context for processing a single field */
export interface FieldContext {
  handler: FieldHandler;
  metadata: FieldMetadata;
  fieldSchema: z.ZodType;
  fieldName: string;
  maxRetries: number;
  formData: Record<string, unknown>;
  retryCount: number;
  formId: string;
  fieldIndex: number;
  allowCancel: boolean;
  previousValue?: unknown;
}

/** Build a RenderContext from current processing state */
function buildRenderCtx(
  input: FormRunnerInput,
  ctx: FieldContext,
  deps: FormRunnerDeps,
): RenderContext {
  return {
    conversation: input.conversation,
    ctx: input.ctx,
    formData: ctx.formData,
    formId: ctx.formId,
    fieldIndex: ctx.fieldIndex,
    previousValue: ctx.previousValue,
    storageClient: deps.storageClient,
    aiClient: deps.aiClient,
    logger: deps.logger,
    t: deps.t,
  };
}

/** Resolve the response context: render, try renderPrompt fallback, fallback to input.ctx */
async function resolveResponseCtx(
  input: FormRunnerInput,
  ctx: FieldContext,
  deps: FormRunnerDeps,
): AsyncResult<unknown, AppError> {
  const renderCtx = buildRenderCtx(input, ctx, deps);
  const rr = await ctx.handler.render(renderCtx, ctx.metadata);
  if (rr.isErr()) return err(rr.error);

  let responseCtx: unknown = rr.value;
  if (responseCtx === undefined && deps.renderPrompt) {
    const promptResult = await deps.renderPrompt(renderCtx, ctx.metadata);
    if (promptResult.isErr()) return err(promptResult.error);
    responseCtx = promptResult.value;
  }
  if (responseCtx === undefined) responseCtx = input.ctx;
  return ok(responseCtx);
}

/** Try to parse and validate a user response; returns ok(value) or err */
function tryParseAndValidate(response: unknown, ctx: FieldContext): Result<unknown, AppError> {
  const { metadata, fieldSchema } = ctx;
  const pr = ctx.handler.parseResponse(response, metadata);
  if (pr.isErr()) return err(pr.error);

  return ctx.handler.validate(pr.value, fieldSchema, metadata);
}

async function maxRetriesError(
  input: FormRunnerInput,
  ctx: FieldContext,
  deps: FormRunnerDeps,
): AsyncResult<unknown, AppError> {
  await logFieldMaxRetries({ input, deps, ctx });
  return err(
    new AppError(INPUT_ENGINE_ERRORS.FIELD_MAX_RETRIES, {
      fieldName: ctx.fieldName,
      fieldType: ctx.metadata.fieldType,
      maxRetries: ctx.maxRetries,
    }),
  );
}

/** Run postProcess on validated value if handler supports it */
async function runPostProcess(
  value: unknown,
  ctx: FieldContext,
  renderCtx: RenderContext,
): AsyncResult<unknown, AppError> {
  if (!ctx.handler.postProcess) return ok(value);
  return ctx.handler.postProcess(value, renderCtx, ctx.metadata);
}

/** Process a single field: render, parse, validate with retry */
export async function processField(
  input: FormRunnerInput,
  ctx: FieldContext,
  deps: FormRunnerDeps,
): AsyncResult<unknown, AppError> {
  const { maxRetries } = ctx;
  let retryCount = 0;

  await logFieldStarted({ input, deps, ctx });

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const rr = await resolveResponseCtx(input, ctx, deps);
    if (rr.isErr()) return err(rr.error);

    const controlResult = await handleControlSignal({
      input,
      ctx,
      deps,
      response: rr.value,
      attempt: attempt + 1,
    });
    if (controlResult) return controlResult;

    await acknowledgeCallbackResponse(input, deps, rr.value);

    const vr = tryParseAndValidate(rr.value, ctx);
    if (vr.isErr()) {
      retryCount++;
      await handleValidationFailure({
        input,
        ctx,
        deps,
        details: { retryCount, error: vr.error },
      });
      continue;
    }

    ctx.retryCount = retryCount;
    await logFieldValidated({ input, deps, ctx });
    const renderCtx = buildRenderCtx(input, ctx, deps);
    return runPostProcess(vr.value, ctx, renderCtx);
  }

  if (ctx.metadata.optional) {
    ctx.retryCount = maxRetries;
    return ok(FIELD_SKIPPED_SENTINEL);
  }
  return maxRetriesError(input, ctx, deps);
}

/** Params for building a field context */
interface FieldBuildParams {
  fieldName: string;
  metadata: FieldMetadata;
  fieldSchema: z.ZodType;
  fieldIndex: number;
  previousValue?: unknown;
}

/** Build FieldContext for a given field, or error if handler missing */
export function buildFieldContext(
  deps: FormRunnerDeps,
  progress: {
    formData: Record<string, unknown>;
    formId: string;
    formOptions?: { allowCancel?: boolean };
  },
  params: FieldBuildParams,
): Result<FieldContext, AppError> {
  const handler = deps.registry.get(params.metadata.fieldType);
  if (!handler) {
    return err(
      new AppError(INPUT_ENGINE_ERRORS.FIELD_TYPE_UNKNOWN, {
        fieldName: params.fieldName,
        fieldType: params.metadata.fieldType,
      }),
    );
  }
  return ok({
    handler,
    metadata: params.metadata,
    fieldSchema: params.fieldSchema,
    fieldName: params.fieldName,
    maxRetries: params.metadata.maxRetries ?? DEFAULT_MAX_RETRIES,
    formData: progress.formData,
    retryCount: 0,
    formId: progress.formId,
    fieldIndex: params.fieldIndex,
    allowCancel: progress.formOptions?.allowCancel ?? true,
    previousValue: params.previousValue,
  });
}
