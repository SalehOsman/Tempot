import { ok, err } from 'neverthrow';
import { z } from 'zod';
import { AppError, type AsyncResult } from '@tempot/shared';
import { INPUT_ENGINE_ERRORS } from '../input-engine.errors.js';
import { guardEnabled } from '../input-engine.guard.js';
import { SchemaValidator } from './schema.validator.js';
import {
  emitFormStarted,
  emitFormCompleted,
  emitFormCancelled,
  emitFormResumed,
  type EventEmitterDeps,
} from './event.emitter.js';
import type {
  InputEngineLogger,
  InputEngineEventBus,
  StorageEngineClient,
  AIExtractionClient,
} from '../input-engine.contracts.js';
import {
  DEFAULT_FORM_OPTIONS,
  type FieldMetadata,
  type FormOptions,
} from '../input-engine.types.js';
import type { FieldHandlerRegistry, RenderContext } from '../fields/field.handler.js';
import type { ConversationsStorageAdapter } from '../storage/conversations-storage.adapter.js';
import { buildStorageKey, restorePartialSave, deletePartialSave } from './partial-save.helper.js';
import { iterateFields } from './field.iterator.js';

/** Dependencies injected into the FormRunner */
export interface FormRunnerDeps {
  registry: FieldHandlerRegistry;
  logger: InputEngineLogger;
  eventBus: InputEngineEventBus;
  isEnabled: () => boolean;
  getActiveConversation: () => string | undefined;
  setActiveConversation: (formId: string | undefined) => void;
  userId: string;
  chatId: number;
  storageAdapter?: ConversationsStorageAdapter;
  renderPrompt?: (
    renderCtx: RenderContext,
    metadata: FieldMetadata,
  ) => AsyncResult<unknown, AppError>;
  t?: (key: string, params?: Record<string, unknown>) => string;
  storageClient?: StorageEngineClient;
  aiClient?: AIExtractionClient;
}

/** Bundled input for runForm: conversation context + schema */
export interface FormRunnerInput {
  conversation: unknown;
  ctx: unknown;
  schema: z.ZodObject<z.ZodRawShape>;
  options?: FormOptions;
}

/** Mutable progress tracker shared between functions */
export interface FormProgress {
  fieldsCompleted: number;
  totalFields: number;
  formId: string;
  formData: Record<string, unknown>;
  completedFieldNames: string[];
  partialSaveEnabled: boolean;
  storageKey: string;
  startTime: number;
  maxMilliseconds: number;
  formOptions?: Required<FormOptions>;
}

function checkPreconditions(
  schema: z.ZodObject<z.ZodRawShape>,
  deps: FormRunnerDeps,
): AppError | undefined {
  const result = new SchemaValidator(deps.registry).validate(schema);
  if (result.isErr()) return result.error;
  const active = deps.getActiveConversation();
  if (active !== undefined) {
    return new AppError(INPUT_ENGINE_ERRORS.FORM_ALREADY_ACTIVE, { existingFormId: active });
  }
  return undefined;
}

/** Try to restore partial save and populate progress */
async function tryRestore(
  deps: FormRunnerDeps,
  progress: FormProgress,
  evDeps: EventEmitterDeps,
): Promise<void> {
  if (!progress.partialSaveEnabled || !deps.storageAdapter) return;

  const saved = await restorePartialSave(
    { storageAdapter: deps.storageAdapter, logger: deps.logger },
    progress.storageKey,
  );
  if (!saved) return;

  Object.assign(progress.formData, saved.formData);
  progress.fieldsCompleted = saved.fieldsCompleted;
  progress.completedFieldNames = saved.completedFieldNames;

  await emitFormResumed(evDeps, {
    formId: progress.formId,
    userId: deps.userId,
    resumedFromField: saved.fieldsCompleted,
    totalFields: progress.totalFields,
  });
}

/** Context bundled for handleResult to stay within max-params */
interface RunContext {
  deps: FormRunnerDeps;
  progress: FormProgress;
  evDeps: EventEmitterDeps;
  merged: Required<FormOptions>;
}

/** Handle iterateFields result: cleanup and emit lifecycle events */
async function handleResult<T>(
  loopResult: Awaited<AsyncResult<void, AppError>>,
  ctx: RunContext,
): AsyncResult<T, AppError> {
  const { deps, progress, evDeps, merged } = ctx;
  const { formId, storageKey, partialSaveEnabled } = progress;
  const psDeps = deps.storageAdapter
    ? { storageAdapter: deps.storageAdapter, logger: deps.logger }
    : undefined;

  if (loopResult.isErr()) {
    deps.setActiveConversation(undefined);
    const code = loopResult.error.code;

    if (code === INPUT_ENGINE_ERRORS.FORM_CANCELLED) {
      if (partialSaveEnabled && psDeps) await deletePartialSave(psDeps, storageKey);
      await emitFormCancelled(evDeps, {
        formId,
        userId: deps.userId,
        fieldsCompleted: progress.fieldsCompleted,
        totalFields: progress.totalFields,
        reason: 'user_cancel',
      });
    } else if (code === INPUT_ENGINE_ERRORS.FORM_TIMEOUT) {
      await emitFormCancelled(evDeps, {
        formId,
        userId: deps.userId,
        fieldsCompleted: progress.fieldsCompleted,
        totalFields: progress.totalFields,
        reason: 'timeout',
      });
    }
    // FIELD_MAX_RETRIES: preserve partial save, no cancelled event
    return err(loopResult.error);
  }

  deps.setActiveConversation(undefined);
  if (partialSaveEnabled && psDeps) await deletePartialSave(psDeps, storageKey);

  const durationMs = Date.now() - progress.startTime;
  await emitFormCompleted(evDeps, {
    formId,
    userId: deps.userId,
    fieldsCompleted: progress.fieldsCompleted,
    durationMs,
    hadPartialSave: merged.partialSave,
  });

  return ok(progress.formData as T);
}

/** Run a form: validate, iterate fields, emit lifecycle events */
async function runFormInternal<T>(
  input: FormRunnerInput,
  deps: FormRunnerDeps,
  options?: FormOptions,
): AsyncResult<T, AppError> {
  const preErr = checkPreconditions(input.schema, deps);
  if (preErr) return err(preErr);

  const merged: Required<FormOptions> = { ...DEFAULT_FORM_OPTIONS, ...options, ...input.options };
  const formId = merged.formId || crypto.randomUUID().slice(0, 8);
  deps.setActiveConversation(formId);

  const psEnabled = merged.partialSave && deps.storageAdapter !== undefined;
  const storageKey = buildStorageKey(deps.chatId, formId);
  const evDeps: EventEmitterDeps = { eventBus: deps.eventBus, logger: deps.logger };
  const fieldCount = Object.keys(input.schema.shape).length;
  const progress: FormProgress = {
    fieldsCompleted: 0,
    totalFields: fieldCount,
    formId,
    formData: {},
    completedFieldNames: [],
    partialSaveEnabled: psEnabled,
    storageKey,
    startTime: Date.now(),
    maxMilliseconds: merged.maxMilliseconds,
  };

  await emitFormStarted(evDeps, { formId, userId: deps.userId, chatId: deps.chatId, fieldCount });
  await tryRestore(deps, progress, evDeps);
  const loopResult = await iterateFields(input, deps, progress);

  return handleResult<T>(loopResult, { deps, progress, evDeps, merged });
}

/** Public entry point — guards on the engine toggle before running */
export async function runForm<T>(
  input: FormRunnerInput,
  deps: FormRunnerDeps,
  options?: FormOptions,
): AsyncResult<T, AppError> {
  return guardEnabled(deps.isEnabled(), () => runFormInternal<T>(input, deps, options));
}
