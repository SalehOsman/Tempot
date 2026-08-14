import { ok, err } from 'neverthrow';
import { z } from 'zod';
import { AppError, type AsyncResult } from '@tempot/shared';
import { INPUT_ENGINE_ERRORS } from '../input-engine.errors.js';
import type { FieldMetadata } from '../input-engine.types.js';
import { FIELD_SKIPPED_SENTINEL } from '../input-engine.types.js';
import { shouldRenderField } from './condition.evaluator.js';
import { emitEvent, type EventEmitterDeps } from './event.emitter.js';
import { maybeSaveProgress } from './partial-save.helper.js';
import { navigateBack } from './back-navigation.helper.js';
import { getFieldMetadata } from './field-metadata.util.js';
import { handleFieldSkip } from './field-skip.helper.js';
import { processField, buildFieldContext, type FieldContext } from './field.processor.js';
import { computeDynamicTotal, renderProgress } from './progress.renderer.js';
import type { FormRunnerDeps, FormRunnerInput, FormProgress } from './form.runner.js';

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

/** Build a metadata map for all fields in the schema */
function buildMetadataMap(
  fieldNames: string[],
  schema: z.ZodObject<z.ZodRawShape>,
): Map<string, FieldMetadata> {
  const map = new Map<string, FieldMetadata>();
  for (const name of fieldNames) {
    const fieldSchema = schema.shape[name] as z.ZodType;
    const metadata = getFieldMetadata(fieldSchema);
    if (metadata) map.set(name, metadata);
  }
  return map;
}

/** Params for processing a single field within the iteration loop */
interface IterationStepParams {
  input: FormRunnerInput;
  deps: FormRunnerDeps;
  progress: FormProgress;
  fieldNames: string[];
  index: number;
}

/** Process one field and return the next index, or an error to abort */
async function processFieldStep(params: IterationStepParams): AsyncResult<number, AppError> {
  const { input, deps, progress, fieldNames, index } = params;
  const fieldName = fieldNames[index]!;
  const fieldSchema = input.schema.shape[fieldName] as z.ZodType;
  const metadata = getFieldMetadata(fieldSchema);

  if (!metadata) {
    deps.logger.debug({
      msg: 'Skipping field without metadata',
      formId: progress.formId,
      fieldName,
    });
    return ok(index + 1);
  }

  if (!shouldRenderField(metadata, progress.formData)) {
    deps.logger.debug({ msg: 'Skipping conditional field', formId: progress.formId, fieldName });
    return ok(index + 1);
  }

  const previousValue = progress.formData[fieldName];
  const ctxResult = buildFieldContext(deps, progress, {
    fieldName,
    metadata,
    fieldSchema,
    fieldIndex: index,
    previousValue,
  });
  if (ctxResult.isErr()) return err(ctxResult.error);
  const fieldCtx = ctxResult.value;

  const result = await processField(input, fieldCtx, deps);

  if (result.isErr() && result.error.code === INPUT_ENGINE_ERRORS.NAVIGATE_BACK) {
    const newIdx = navigateBack({
      currentIndex: index,
      fieldNames,
      progress,
      schema: input.schema,
      deps,
    });
    await maybeSaveProgress(deps, progress);
    return ok(newIdx);
  }

  if (result.isOk() && result.value === FIELD_SKIPPED_SENTINEL) {
    await handleFieldSkip(deps, progress, fieldCtx);
    return ok(index + 1);
  }

  if (result.isErr()) return err(result.error);

  await handleFieldSuccess({ deps, progress, ctx: fieldCtx, value: result.value });
  return ok(index + 1);
}

/** Iterate all schema fields, processing each one */
export async function iterateFields(
  input: FormRunnerInput,
  deps: FormRunnerDeps,
  progress: FormProgress,
): AsyncResult<void, AppError> {
  const fieldNames = Object.keys(input.schema.shape);
  progress.totalFields = fieldNames.length;
  const progressMeta = progress.formOptions?.showProgress
    ? buildMetadataMap(fieldNames, input.schema)
    : undefined;

  let index = 0;
  while (index < fieldNames.length) {
    const deadlineErr = checkDeadline(progress);
    if (deadlineErr) return err(deadlineErr);

    if (progress.completedFieldNames.includes(fieldNames[index]!)) {
      index++;
      continue;
    }

    if (progressMeta) {
      const dynamicTotal = computeDynamicTotal({
        fieldNames,
        allMetadata: progressMeta,
        formData: progress.formData,
        shouldRenderFn: shouldRenderField,
      });
      const currentPos = progress.fieldsCompleted + 1;
      const progressText = renderProgress(currentPos, dynamicTotal, deps.t);
      deps.logger.debug({ msg: 'Progress', progressText, fieldName: fieldNames[index] });
    }

    const stepResult = await processFieldStep({ input, deps, progress, fieldNames, index });
    if (stepResult.isErr()) return err(stepResult.error);
    index = stepResult.value;
  }

  return ok(undefined);
}
