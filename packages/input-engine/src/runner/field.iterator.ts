import { ok, err } from 'neverthrow';
import { z } from 'zod';
import { AppError } from '@tempot/shared';
import type { AsyncResult } from '@tempot/shared';
import { INPUT_ENGINE_ERRORS } from '../input-engine.errors.js';
import { shouldRenderField } from './condition.evaluator.js';
import { emitEvent } from './event.emitter.js';
import type { EventEmitterDeps } from './event.emitter.js';
import type { FieldMetadata } from '../input-engine.types.js';
import type { FieldHandler, RenderContext } from '../fields/field.handler.js';
import { saveFieldProgress } from './partial-save.helper.js';
import { navigateBack } from './back-navigation.helper.js';
import type { FormRunnerDeps } from './form.runner.js';
import type { FormRunnerInput, FormProgress } from './form.runner.js';

const DEFAULT_MAX_RETRIES = 3;

/** Internal context for processing a single field */
interface FieldContext {
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

/** Process a single field: render, parse, validate with retry */
async function processField(
  input: FormRunnerInput,
  ctx: FieldContext,
  deps: FormRunnerDeps,
): AsyncResult<unknown, AppError> {
  const { handler, metadata, fieldSchema, maxRetries } = ctx;
  let retryCount = 0;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const renderCtx: RenderContext = {
      conversation: input.conversation,
      ctx: input.ctx,
      formData: ctx.formData,
      formId: ctx.formId,
      fieldIndex: ctx.fieldIndex,
    };

    const rr = await handler.render(renderCtx, metadata);
    if (rr.isErr()) return err(rr.error);

    let responseCtx: unknown = rr.value;
    if (responseCtx === undefined && deps.renderPrompt) {
      const promptResult = await deps.renderPrompt(renderCtx, metadata);
      if (promptResult.isErr()) return err(promptResult.error);
      responseCtx = promptResult.value;
    }
    if (responseCtx === undefined) {
      responseCtx = input.ctx;
    }

    const pr = handler.parseResponse(responseCtx, metadata);
    if (pr.isErr()) {
      retryCount++;
      continue;
    }

    const vr = handler.validate(pr.value, fieldSchema, metadata);
    if (vr.isErr()) {
      retryCount++;
      continue;
    }

    ctx.retryCount = retryCount;
    return ok(vr.value);
  }

  return err(
    new AppError(INPUT_ENGINE_ERRORS.FIELD_MAX_RETRIES, {
      fieldName: ctx.fieldName,
      fieldType: metadata.fieldType,
      maxRetries,
    }),
  );
}

/** Save current field progress if partial save is enabled */
async function maybeSaveProgress(deps: FormRunnerDeps, progress: FormProgress): Promise<void> {
  if (!progress.partialSaveEnabled || !deps.storageAdapter) return;

  await saveFieldProgress(
    { storageAdapter: deps.storageAdapter, logger: deps.logger },
    progress.storageKey,
    {
      formData: { ...progress.formData },
      fieldsCompleted: progress.fieldsCompleted,
      completedFieldNames: [...progress.completedFieldNames],
    },
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
function buildFieldContext(
  deps: FormRunnerDeps,
  progress: FormProgress,
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

function getFieldMetadata(schema: z.ZodType): FieldMetadata {
  const meta = z.globalRegistry.get(schema);
  return (meta as Record<string, unknown> | undefined)?.['input-engine'] as FieldMetadata;
}

/** Bundled params for handleFieldSuccess to stay within max-params */
interface FieldSuccessParams {
  deps: FormRunnerDeps;
  progress: FormProgress;
  ctx: FieldContext;
  value: unknown;
}

/** Handle a successful field result: update progress and emit event */
async function handleFieldSuccess(params: FieldSuccessParams): Promise<void> {
  const { deps, progress, ctx, value } = params;
  const evDeps: EventEmitterDeps = { eventBus: deps.eventBus, logger: deps.logger };
  progress.formData[ctx.fieldName] = value;
  progress.fieldsCompleted++;
  progress.completedFieldNames.push(ctx.fieldName);
  await maybeSaveProgress(deps, progress);

  await emitEvent(evDeps, 'input-engine.field.validated', {
    formId: progress.formId,
    userId: deps.userId,
    fieldType: ctx.metadata.fieldType,
    fieldName: ctx.fieldName,
    valid: true,
    retryCount: ctx.retryCount,
  });
}

/** Check if the form deadline has been exceeded */
function checkDeadline(progress: FormProgress): AppError | undefined {
  if (Date.now() - progress.startTime > progress.maxMilliseconds) {
    return new AppError(INPUT_ENGINE_ERRORS.FORM_TIMEOUT, {
      formId: progress.formId,
      elapsedMs: Date.now() - progress.startTime,
      maxMs: progress.maxMilliseconds,
    });
  }
  return undefined;
}

/** Iterate all schema fields, processing each one */
export async function iterateFields(
  input: FormRunnerInput,
  deps: FormRunnerDeps,
  progress: FormProgress,
): AsyncResult<void, AppError> {
  const fieldNames = Object.keys(input.schema.shape);
  progress.totalFields = fieldNames.length;

  let index = 0;
  while (index < fieldNames.length) {
    const fieldName = fieldNames[index]!;

    const deadlineErr = checkDeadline(progress);
    if (deadlineErr) return err(deadlineErr);

    if (progress.completedFieldNames.includes(fieldName)) {
      index++;
      continue;
    }

    const fieldSchema = input.schema.shape[fieldName] as z.ZodType;
    const metadata = getFieldMetadata(fieldSchema);

    if (!shouldRenderField(metadata, progress.formData)) {
      deps.logger.debug({ msg: 'Skipping conditional field', formId: progress.formId, fieldName });
      index++;
      continue;
    }

    const ctxOrErr = buildFieldContext(deps, progress, {
      fieldName,
      metadata,
      fieldSchema,
      fieldIndex: index,
    });
    if (ctxOrErr instanceof AppError) return err(ctxOrErr);

    const result = await processField(input, ctxOrErr, deps);

    if (result.isErr() && result.error.code === INPUT_ENGINE_ERRORS.NAVIGATE_BACK) {
      index = navigateBack({
        currentIndex: index,
        fieldNames,
        progress,
        schema: input.schema,
        deps,
      });
      await maybeSaveProgress(deps, progress);
      continue;
    }

    if (result.isErr()) return err(result.error);

    await handleFieldSuccess({ deps, progress, ctx: ctxOrErr, value: result.value });
    index++;
  }

  return ok(undefined);
}
