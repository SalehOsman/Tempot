import { InteractionEventRepository } from '@tempot/database';
import type { InteractionEvent, InteractionEventSink } from '@tempot/interaction-observability';
import type { AsyncResult } from '@tempot/shared';
import { err, ok } from 'neverthrow';
import type { ModuleLogger } from '../bot-server.types.js';

export function createInteractionEventWriter(log: ModuleLogger): InteractionEventSink {
  const repository = new InteractionEventRepository();

  return {
    write: async (event: InteractionEvent): AsyncResult<void> => {
      const result = await repository.create({
        traceId: event.traceId,
        sequence: event.sequence,
        updateId: event.updateId,
        updateType: event.updateType,
        command: event.command,
        callbackData: event.callbackData,
        callbackNamespace: event.callbackNamespace,
        module: event.module,
        userId: event.userId,
        chatId: event.chatId,
        stage: event.stage,
        status: event.status,
        action: event.action,
        viewKey: event.viewKey,
        responseType: event.responseType,
        reason: event.reason,
        errorCode: event.errorCode,
        referenceCode: event.referenceCode,
        metadata: event.metadata,
        occurredAt: event.occurredAt,
      });

      if (result.isErr()) {
        log.warn({
          code: 'bot-server.interaction_event_persist_failed',
          traceId: event.traceId,
          sequence: event.sequence,
          stage: event.stage,
          error: result.error.code,
        });
        return err(result.error);
      }

      return ok(undefined);
    },
  };
}
