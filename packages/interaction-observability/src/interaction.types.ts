import type { AsyncResult } from '@tempot/shared';

export type InteractionUpdateType = 'command' | 'callback_query' | 'message';

export type InteractionEventStage =
  | 'received'
  | 'routed'
  | 'handler_started'
  | 'view_rendered'
  | 'edit_attempted'
  | 'edit_success'
  | 'edit_noop'
  | 'reply_sent'
  | 'fallback_reply_sent'
  | 'callback_answered'
  | 'response_failed'
  | 'failed'
  | 'completed';

export type InteractionEventStatus =
  | 'received'
  | 'attempted'
  | 'succeeded'
  | 'skipped'
  | 'failed'
  | 'completed';

export interface InteractionTraceInput {
  readonly traceId: string;
  readonly updateId?: number;
  readonly updateType: InteractionUpdateType;
  readonly command?: string;
  readonly callbackData?: string;
  readonly callbackNamespace?: string;
  readonly module: string;
  readonly userId?: number;
  readonly chatId?: number;
  readonly startedAt?: number;
}

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
  eventCount: number;
  lastResponseType?: string;
  startedAt: number;
}

export interface InteractionEventInput {
  readonly stage: InteractionEventStage;
  readonly status: InteractionEventStatus;
  readonly action?: string;
  readonly viewKey?: string;
  readonly responseType?: string;
  readonly reason?: string;
  readonly errorCode?: string;
  readonly referenceCode?: string;
  readonly metadata?: Record<string, unknown>;
}

export interface InteractionEvent {
  readonly traceId: string;
  readonly sequence: number;
  readonly updateId?: number;
  readonly updateType: InteractionUpdateType;
  readonly command?: string;
  readonly callbackData?: string;
  readonly callbackNamespace?: string;
  readonly module: string;
  readonly userId?: string;
  readonly chatId?: string;
  readonly stage: InteractionEventStage;
  readonly status: InteractionEventStatus;
  readonly action?: string;
  readonly viewKey?: string;
  readonly responseType?: string;
  readonly reason?: string;
  readonly errorCode?: string;
  readonly referenceCode?: string;
  readonly metadata?: Record<string, unknown>;
  readonly occurredAt: Date;
}

export interface InteractionEventSink {
  write(event: InteractionEvent): AsyncResult<void>;
}

export interface InteractionRecorderLogger {
  warn(data: Record<string, unknown>): void;
  debug?(data: Record<string, unknown>): void;
}

export interface InteractionRecorderDeps {
  readonly sink: InteractionEventSink;
  readonly logger: InteractionRecorderLogger;
  readonly clock?: () => Date;
}

export interface InteractionRecorderLike {
  record(trace: InteractionTrace, event: InteractionEventInput): AsyncResult<InteractionEvent>;
}
