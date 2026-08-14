import type { AsyncResult } from '@tempot/shared';
import { err, ok } from 'neverthrow';
import type {
  InteractionEvent,
  InteractionEventInput,
  InteractionRecorderDeps,
  InteractionRecorderLike,
  InteractionTrace,
} from './interaction.types.js';

export class InteractionRecorder implements InteractionRecorderLike {
  constructor(private readonly deps: InteractionRecorderDeps) {}

  async record(
    trace: InteractionTrace,
    input: InteractionEventInput,
  ): AsyncResult<InteractionEvent> {
    const event = buildEvent(trace, input, this.deps.clock?.() ?? new Date());
    const result = await this.deps.sink.write(event);
    if (result.isErr()) {
      this.deps.logger.warn({
        code: 'interaction-observability.event_persist_failed',
        traceId: event.traceId,
        sequence: event.sequence,
        stage: event.stage,
        status: event.status,
        error: result.error.code,
      });
      return err(result.error);
    }

    return ok(event);
  }
}

function buildEvent(
  trace: InteractionTrace,
  input: InteractionEventInput,
  occurredAt: Date,
): InteractionEvent {
  trace.eventCount += 1;
  return {
    traceId: trace.traceId,
    sequence: trace.eventCount,
    updateId: trace.updateId,
    updateType: trace.updateType,
    command: trace.command,
    callbackData: trace.callbackData,
    callbackNamespace: trace.callbackNamespace,
    module: trace.module,
    userId: trace.userId === undefined ? undefined : String(trace.userId),
    chatId: trace.chatId === undefined ? undefined : String(trace.chatId),
    stage: input.stage,
    status: input.status,
    action: input.action ?? trace.callbackData ?? trace.command,
    viewKey: input.viewKey,
    responseType: input.responseType,
    reason: input.reason,
    errorCode: input.errorCode,
    referenceCode: input.referenceCode,
    metadata: input.metadata,
    occurredAt,
  };
}
