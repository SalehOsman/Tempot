import type { AsyncResult } from '@tempot/shared';
import { err, ok } from 'neverthrow';
import type {
  InteractionEventInput,
  InteractionRecorderLike,
  InteractionTrace,
} from './interaction.types.js';

export const INTERACTION_TRACE_KEY = 'interactionTrace';
export const INTERACTION_RECORDER_KEY = 'interactionRecorder';

function contextRecord(ctx: object): Record<string, unknown> {
  return ctx as Record<string, unknown>;
}

export function setInteractionTrace(ctx: object, trace: InteractionTrace): void {
  contextRecord(ctx)[INTERACTION_TRACE_KEY] = trace;
}

export function getInteractionTrace(ctx: object): InteractionTrace | undefined {
  const value = contextRecord(ctx)[INTERACTION_TRACE_KEY];
  return isInteractionTrace(value) ? value : undefined;
}

export function setInteractionRecorder(ctx: object, recorder: InteractionRecorderLike): void {
  contextRecord(ctx)[INTERACTION_RECORDER_KEY] = recorder;
}

export function getInteractionRecorder(ctx: object): InteractionRecorderLike | undefined {
  const value = contextRecord(ctx)[INTERACTION_RECORDER_KEY];
  return isInteractionRecorder(value) ? value : undefined;
}

export async function recordInteractionStep(
  ctx: object,
  input: InteractionEventInput,
): AsyncResult<void> {
  const trace = getInteractionTrace(ctx);
  const recorder = getInteractionRecorder(ctx);
  if (!trace || !recorder) return ok(undefined);

  const result = await recorder.record(trace, input);
  if (result.isErr()) return err(result.error);
  return ok(undefined);
}

function isInteractionTrace(value: unknown): value is InteractionTrace {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record['traceId'] === 'string' &&
    typeof record['updateType'] === 'string' &&
    typeof record['module'] === 'string' &&
    typeof record['responseCount'] === 'number' &&
    typeof record['eventCount'] === 'number' &&
    typeof record['startedAt'] === 'number'
  );
}

function isInteractionRecorder(value: unknown): value is InteractionRecorderLike {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return typeof record['record'] === 'function';
}
