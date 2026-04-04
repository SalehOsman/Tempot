import { ok, err } from 'neverthrow';
import { z } from 'zod';
import { AppError, type AsyncResult } from '@tempot/shared';
import { INPUT_ENGINE_ERRORS } from '../input-engine.errors.js';
import { FIELD_SKIPPED_SENTINEL, type FieldMetadata } from '../input-engine.types.js';
import type { FieldHandler, RenderContext } from '../fields/field.handler.js';
import type { FormRunnerDeps, FormRunnerInput } from './form.runner.js';

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
}

/** Resolve the response context: render, try renderPrompt fallback, fallback to input.ctx */
async function resolveResponseCtx(
  input: FormRunnerInput,
  ctx: FieldContext,
  deps: FormRunnerDeps,
): AsyncResult<unknown, AppError> {
  const renderCtx: RenderContext = {
    conversation: input.conversation,
    ctx: input.ctx,
    formData: ctx.formData,
    formId: ctx.formId,
    fieldIndex: ctx.fieldIndex,
  };
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

/** Process a single field: render, parse, validate with retry */
export async function processField(
  input: FormRunnerInput,
  ctx: FieldContext,
  deps: FormRunnerDeps,
): AsyncResult<unknown, AppError> {
  const { metadata, fieldSchema, maxRetries } = ctx;
  let retryCount = 0;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const rr = await resolveResponseCtx(input, ctx, deps);
    if (rr.isErr()) return err(rr.error);

    const pr = ctx.handler.parseResponse(rr.value, metadata);
    if (pr.isErr()) {
      retryCount++;
      continue;
    }

    const vr = ctx.handler.validate(pr.value, fieldSchema, metadata);
    if (vr.isErr()) {
      retryCount++;
      continue;
    }

    ctx.retryCount = retryCount;
    return ok(vr.value);
  }

  if (ctx.metadata.optional) {
    ctx.retryCount = maxRetries;
    return ok(FIELD_SKIPPED_SENTINEL);
  }
  return err(
    new AppError(INPUT_ENGINE_ERRORS.FIELD_MAX_RETRIES, {
      fieldName: ctx.fieldName,
      fieldType: metadata.fieldType,
      maxRetries,
    }),
  );
}

/** Params for building a field context */
interface FieldBuildParams {
  fieldName: string;
  metadata: FieldMetadata;
  fieldSchema: z.ZodType;
  fieldIndex: number;
}

/** Build FieldContext for a given field, or error if handler missing */
export function buildFieldContext(
  deps: FormRunnerDeps,
  progress: { formData: Record<string, unknown>; formId: string },
  params: FieldBuildParams,
): FieldContext | AppError {
  const handler = deps.registry.get(params.metadata.fieldType);
  if (!handler) {
    return new AppError(INPUT_ENGINE_ERRORS.FIELD_TYPE_UNKNOWN, {
      fieldName: params.fieldName,
      fieldType: params.metadata.fieldType,
    });
  }
  return {
    handler,
    metadata: params.metadata,
    fieldSchema: params.fieldSchema,
    fieldName: params.fieldName,
    maxRetries: params.metadata.maxRetries ?? DEFAULT_MAX_RETRIES,
    formData: progress.formData,
    retryCount: 0,
    formId: progress.formId,
    fieldIndex: params.fieldIndex,
  };
}
