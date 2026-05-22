import type { Context } from 'grammy';
import type { InteractionUpdateType } from './interaction-routing.js';

export interface InteractionTrace {
  traceId: string;
  updateId?: number;
  updateType: InteractionUpdateType;
  command?: string;
  callbackData?: string;
  callbackNamespace?: string;
  module: string;
  userId?: number;
  chatId?: number;
  responseCount: number;
  lastResponseType?: string;
  startedAt: number;
}

export const INTERACTION_TRACE_KEY = 'interactionTrace';

function traceRecord(ctx: Context): Record<string, unknown> {
  return ctx as unknown as Record<string, unknown>;
}

export function setInteractionTrace(ctx: Context, trace: InteractionTrace): void {
  traceRecord(ctx)[INTERACTION_TRACE_KEY] = trace;
}

export function getInteractionTrace(ctx: Context): InteractionTrace | undefined {
  const value = traceRecord(ctx)[INTERACTION_TRACE_KEY];
  if (!isInteractionTrace(value)) return undefined;
  return value;
}

function isInteractionTrace(value: unknown): value is InteractionTrace {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record['traceId'] === 'string' &&
    typeof record['updateType'] === 'string' &&
    typeof record['module'] === 'string' &&
    typeof record['responseCount'] === 'number' &&
    typeof record['startedAt'] === 'number'
  );
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
    lastResponseType: trace.lastResponseType,
  };
}
