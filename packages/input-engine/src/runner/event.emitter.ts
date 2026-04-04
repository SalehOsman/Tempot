import type { InputEngineEventBus, InputEngineLogger } from '../input-engine.contracts.js';

/** Bundled dependencies for safe event emission */
export interface EventEmitterDeps {
  eventBus: InputEngineEventBus;
  logger: InputEngineLogger;
}

/**
 * Safely emit an event. Failures are logged but never propagated.
 */
export async function emitEvent(
  deps: EventEmitterDeps,
  eventName: string,
  payload: unknown,
): Promise<void> {
  const result = await deps.eventBus.publish(eventName, payload);
  if (result.isErr()) {
    deps.logger.warn({
      msg: 'Event emission failed',
      eventName,
      errorCode: result.error.code,
    });
  }
}

/** Form lifecycle event payloads */
interface FormStartedPayload {
  formId: string;
  userId: string;
  chatId: number;
  fieldCount: number;
}

interface FormCompletedPayload {
  formId: string;
  userId: string;
  fieldsCompleted: number;
  durationMs: number;
  hadPartialSave: boolean;
}

interface FormCancelledPayload {
  formId: string;
  userId: string;
  fieldsCompleted: number;
  totalFields: number;
  reason: 'user_cancel' | 'timeout' | 'max_retries';
}

interface FormResumedPayload {
  formId: string;
  userId: string;
  resumedFromField: number;
  totalFields: number;
}

export async function emitFormStarted(
  deps: EventEmitterDeps,
  payload: FormStartedPayload,
): Promise<void> {
  await emitEvent(deps, 'input-engine.form.started', {
    ...payload,
    timestamp: new Date(),
  });
}

export async function emitFormCompleted(
  deps: EventEmitterDeps,
  payload: FormCompletedPayload,
): Promise<void> {
  await emitEvent(deps, 'input-engine.form.completed', {
    ...payload,
    fieldCount: payload.fieldsCompleted,
  });
}

export async function emitFormCancelled(
  deps: EventEmitterDeps,
  payload: FormCancelledPayload,
): Promise<void> {
  await emitEvent(deps, 'input-engine.form.cancelled', {
    ...payload,
  });
}

export async function emitFormResumed(
  deps: EventEmitterDeps,
  payload: FormResumedPayload,
): Promise<void> {
  await emitEvent(deps, 'input-engine.form.resumed', {
    ...payload,
    timestamp: new Date(),
  });
}

/** Field skip event payload */
export interface FieldSkippedPayload {
  formId: string;
  userId: string;
  fieldName: string;
  fieldType: string;
  reason: 'user_skip' | 'max_retries_skip' | 'condition';
}

export async function emitFieldSkipped(
  deps: EventEmitterDeps,
  payload: FieldSkippedPayload,
): Promise<void> {
  await emitEvent(deps, 'input-engine.field.skipped', {
    ...payload,
    timestamp: new Date(),
  });
}
