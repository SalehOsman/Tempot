import type { InteractionEvent } from './interaction.types.js';

export function toInteractionEventLog(event: InteractionEvent): Record<string, unknown> {
  return {
    traceId: event.traceId,
    sequence: event.sequence,
    updateType: event.updateType,
    module: event.module,
    action: event.action,
    stage: event.stage,
    status: event.status,
    viewKey: event.viewKey,
    reason: event.reason,
    responseType: event.responseType,
    referenceCode: event.referenceCode,
    errorCode: event.errorCode,
  };
}
