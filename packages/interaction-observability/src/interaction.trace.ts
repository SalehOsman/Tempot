import type { InteractionTrace, InteractionTraceInput } from './interaction.types.js';

export function createInteractionTrace(input: InteractionTraceInput): InteractionTrace {
  return {
    traceId: input.traceId,
    updateId: input.updateId,
    updateType: input.updateType,
    command: input.command,
    callbackData: input.callbackData,
    callbackNamespace: input.callbackNamespace,
    module: input.module,
    userId: input.userId,
    chatId: input.chatId,
    responseCount: 0,
    eventCount: 0,
    startedAt: input.startedAt ?? Date.now(),
  };
}

export function toInteractionTraceLog(trace: InteractionTrace): Record<string, unknown> {
  return {
    traceId: trace.traceId,
    updateId: trace.updateId,
    updateType: trace.updateType,
    command: trace.command,
    callbackData: trace.callbackData,
    callbackNamespace: trace.callbackNamespace,
    module: trace.module,
    userId: trace.userId,
    chatId: trace.chatId,
    responseCount: trace.responseCount,
    eventCount: trace.eventCount,
    lastResponseType: trace.lastResponseType,
  };
}
