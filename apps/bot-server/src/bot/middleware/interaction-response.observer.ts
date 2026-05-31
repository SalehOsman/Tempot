import type { Context } from 'grammy';
import {
  toInteractionTraceLog,
  type InteractionEventInput,
  type InteractionEventStage,
  type InteractionEventStatus,
  type InteractionTrace,
} from '@tempot/interaction-observability';
import type { InteractionObserverDeps } from './interaction-observer.types.js';

interface BaseObserverParams {
  ctx: Context;
  deps: InteractionObserverDeps;
  trace: InteractionTrace;
}

interface ReplyObserverParams extends BaseObserverParams {
  reply: Context['reply'];
}

interface EditObserverParams extends BaseObserverParams {
  editMessageText: Context['editMessageText'];
}

interface CallbackAnswerObserverParams extends BaseObserverParams {
  answerCallbackQuery: Context['answerCallbackQuery'];
}

interface ResponseFailureParams {
  deps: InteractionObserverDeps;
  trace: InteractionTrace;
  responseType: string;
  error: unknown;
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function interactionAction(trace: InteractionTrace): string {
  return trace.callbackData ?? trace.command ?? 'message';
}

export async function recordObserverStep(
  deps: InteractionObserverDeps,
  trace: InteractionTrace,
  event: InteractionEventInput,
): Promise<void> {
  if (!deps.interactionRecorder) return;
  try {
    const result = await deps.interactionRecorder.record(trace, event);
    if (result.isErr()) {
      deps.logger.warn?.({
        code: 'bot-server.interaction_event_record_failed',
        traceId: trace.traceId,
        stage: event.stage,
        status: event.status,
        error: result.error.code,
      });
    }
  } catch (error: unknown) {
    deps.logger.warn?.({
      code: 'bot-server.interaction_event_record_threw',
      traceId: trace.traceId,
      stage: event.stage,
      status: event.status,
      error: errorMessage(error),
    });
  }
}

export function observeResponses(
  ctx: Context,
  deps: InteractionObserverDeps,
  trace: InteractionTrace,
): void {
  const partial = ctx as Partial<
    Pick<Context, 'reply' | 'editMessageText' | 'answerCallbackQuery'>
  >;
  if (partial.reply) observeReply({ ctx, deps, trace, reply: partial.reply });
  if (partial.editMessageText) {
    observeEditMessageText({ ctx, deps, trace, editMessageText: partial.editMessageText });
  }
  if (partial.answerCallbackQuery) {
    observeAnswerCallbackQuery({
      ctx,
      deps,
      trace,
      answerCallbackQuery: partial.answerCallbackQuery,
    });
  }
}

function observeReply(params: ReplyObserverParams): void {
  const { ctx, deps, trace, reply } = params;
  const originalReply = reply.bind(ctx);
  ctx.reply = (async (...args: Parameters<Context['reply']>) => {
    try {
      const result = await originalReply(...args);
      await recordResponseSuccess(deps, trace, 'reply');
      return result;
    } catch (error: unknown) {
      await recordResponseFailure({ deps, trace, responseType: 'reply', error });
      throw error;
    }
  }) as Context['reply'];
}

function observeEditMessageText(params: EditObserverParams): void {
  const { ctx, deps, trace, editMessageText } = params;
  const originalEditMessageText = editMessageText.bind(ctx);
  ctx.editMessageText = (async (...args: Parameters<Context['editMessageText']>) => {
    try {
      const result = await originalEditMessageText(...args);
      await recordResponseSuccess(deps, trace, 'editMessageText');
      return result;
    } catch (error: unknown) {
      await recordResponseFailure({ deps, trace, responseType: 'editMessageText', error });
      throw error;
    }
  }) as Context['editMessageText'];
}

function observeAnswerCallbackQuery(params: CallbackAnswerObserverParams): void {
  const { ctx, deps, trace, answerCallbackQuery } = params;
  const originalAnswerCallbackQuery = answerCallbackQuery.bind(ctx);
  ctx.answerCallbackQuery = (async (...args: Parameters<Context['answerCallbackQuery']>) => {
    try {
      const result = await originalAnswerCallbackQuery(...args);
      await recordResponseSuccess(deps, trace, 'answerCallbackQuery');
      return result;
    } catch (error: unknown) {
      await recordResponseFailure({ deps, trace, responseType: 'answerCallbackQuery', error });
      throw error;
    }
  }) as Context['answerCallbackQuery'];
}

async function recordResponseSuccess(
  deps: InteractionObserverDeps,
  trace: InteractionTrace,
  responseType: string,
): Promise<void> {
  logResponse(deps, trace, responseType);
  await recordObserverStep(deps, trace, {
    stage: responseSuccessStage(responseType),
    status: 'succeeded',
    action: interactionAction(trace),
    responseType,
  });
}

async function recordResponseFailure(params: ResponseFailureParams): Promise<void> {
  const { deps, trace, responseType, error } = params;
  logResponseFailure(params);
  await recordObserverStep(deps, trace, {
    ...responseFailureEvent(responseType, error),
    action: interactionAction(trace),
    responseType,
    metadata: { error: errorMessage(error) },
  });
}

function logResponse(
  deps: InteractionObserverDeps,
  trace: InteractionTrace,
  responseType: string,
): void {
  trace.responseCount += 1;
  trace.lastResponseType = responseType;
  deps.logger.info({
    code: 'bot-server.interaction_response_sent',
    ...toInteractionTraceLog(trace),
    responseType,
    status: 'responded',
  });
}

function logResponseFailure(params: ResponseFailureParams): void {
  const { deps, trace, responseType, error } = params;
  deps.logger.error({
    code: 'bot-server.interaction_response_failed',
    ...toInteractionTraceLog(trace),
    responseType,
    status: 'failed',
    error: errorMessage(error),
  });
}

function responseSuccessStage(responseType: string): InteractionEventStage {
  if (responseType === 'reply') return 'reply_sent';
  if (responseType === 'answerCallbackQuery') return 'callback_answered';
  return 'edit_success';
}

function responseFailureEvent(
  responseType: string,
  error: unknown,
): {
  stage: InteractionEventStage;
  status: InteractionEventStatus;
  reason: string;
} {
  if (responseType === 'editMessageText' && isNoOpError(error)) {
    return { stage: 'edit_noop', status: 'skipped', reason: 'message_not_modified' };
  }
  return { stage: 'response_failed', status: 'failed', reason: 'telegram_response_failed' };
}

function isNoOpError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : '';
  return message.includes('message is not modified');
}
