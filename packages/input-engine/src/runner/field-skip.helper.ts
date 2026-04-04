import type { EventEmitterDeps } from './event.emitter.js';
import { emitFieldSkipped } from './event.emitter.js';
import { saveFieldProgress } from './partial-save.helper.js';
import type { FormRunnerDeps } from './form.runner.js';
import type { FormProgress } from './form.runner.js';
import type { FieldMetadata } from '../input-engine.types.js';

/** Context needed to handle a skipped field */
export interface FieldSkipContext {
  fieldName: string;
  metadata: FieldMetadata;
  retryCount: number;
  maxRetries: number;
}

/** Handle a skipped field: set undefined, update progress, emit skip event */
export async function handleFieldSkip(
  deps: FormRunnerDeps,
  progress: FormProgress,
  ctx: FieldSkipContext,
): Promise<void> {
  const evDeps: EventEmitterDeps = { eventBus: deps.eventBus, logger: deps.logger };
  progress.formData[ctx.fieldName] = undefined;
  progress.fieldsCompleted++;
  progress.completedFieldNames.push(ctx.fieldName);

  if (progress.partialSaveEnabled && deps.storageAdapter) {
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

  const reason = ctx.retryCount >= ctx.maxRetries ? 'max_retries_skip' : 'user_skip';
  await emitFieldSkipped(evDeps, {
    formId: progress.formId,
    userId: deps.userId,
    fieldName: ctx.fieldName,
    fieldType: ctx.metadata.fieldType,
    reason,
  });
}
