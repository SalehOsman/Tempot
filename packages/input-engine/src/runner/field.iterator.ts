import { ok, err } from 'neverthrow';
import { z } from 'zod';
import { AppError } from '@tempot/shared';
import type { AsyncResult } from '@tempot/shared';
import { INPUT_ENGINE_ERRORS } from '../input-engine.errors.js';
import { shouldRenderField } from './condition.evaluator.js';
import { emitEvent } from './event.emitter.js';
import type { EventEmitterDeps } from './event.emitter.js';
import type { FieldMetadata } from '../input-engine.types.js';
import type { FieldHandler } from '../fields/field.handler.js';
import { saveFieldProgress } from './partial-save.helper.js';
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
}

/** Process a single field: render, parse, validate with retry */
async function processField(
  input: FormRunnerInput,
  ctx: FieldContext,
): AsyncResult<unknown, AppError> {
  const { handler, metadata, fieldSchema, maxRetries } = ctx;
  let retryCount = 0;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const rr = await handler.render(
      { conversation: input.conversation, ctx: input.ctx, formData: ctx.formData },
      metadata,
    );
    if (rr.isErr()) return err(rr.error);

    const pr = handler.parseResponse(input.ctx, metadata);
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
  };
}

function getFieldMetadata(schema: z.ZodType): FieldMetadata {
  const meta = z.globalRegistry.get(schema);
  return (meta as Record<string, unknown> | undefined)?.['input-engine'] as FieldMetadata;
}

/** Iterate all schema fields, processing each one */
export async function iterateFields(
  input: FormRunnerInput,
  deps: FormRunnerDeps,
  progress: FormProgress,
): AsyncResult<void, AppError> {
  const fieldNames = Object.keys(input.schema.shape);
  const evDeps: EventEmitterDeps = { eventBus: deps.eventBus, logger: deps.logger };
  progress.totalFields = fieldNames.length;

  for (const fieldName of fieldNames) {
    if (progress.completedFieldNames.includes(fieldName)) continue;

    const fieldSchema = input.schema.shape[fieldName] as z.ZodType;
    const metadata = getFieldMetadata(fieldSchema);

    if (!shouldRenderField(metadata, progress.formData)) {
      deps.logger.debug({ msg: 'Skipping conditional field', formId: progress.formId, fieldName });
      continue;
    }

    const ctxOrErr = buildFieldContext(deps, progress, { fieldName, metadata, fieldSchema });
    if (ctxOrErr instanceof AppError) return err(ctxOrErr);

    const result = await processField(input, ctxOrErr);
    if (result.isErr()) return err(result.error);

    progress.formData[fieldName] = result.value;
    progress.fieldsCompleted++;
    progress.completedFieldNames.push(fieldName);
    await maybeSaveProgress(deps, progress);

    await emitEvent(evDeps, 'input-engine.field.validated', {
      formId: progress.formId,
      userId: deps.userId,
      fieldType: metadata.fieldType,
      fieldName,
      valid: true,
      retryCount: ctxOrErr.retryCount,
    });
  }

  return ok(undefined);
}
