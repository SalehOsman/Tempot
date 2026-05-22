import type { Context, NextFunction } from 'grammy';
import { randomUUID } from 'node:crypto';
import {
  extractCallbackNamespace,
  extractCommand,
  resolveInteractionModule,
  resolveUpdateType,
} from '../interaction-routing.js';
import {
  setInteractionTrace,
  toInteractionTraceLog,
  type InteractionTrace,
} from '../interaction-trace.js';

interface ObserverLogger {
  info: (data: object) => void;
  error: (data: object) => void;
}

export interface InteractionObserverDeps {
  logger: ObserverLogger;
  commandModuleMap?: Record<string, string>;
  traceIdFactory?: () => string;
}

function buildTrace(ctx: Context, deps: InteractionObserverDeps): InteractionTrace {
  const command = extractCommand(ctx.message?.text);
  const callbackData = ctx.callbackQuery?.data;
  const callbackNamespace = extractCallbackNamespace(callbackData);
  return {
    traceId: deps.traceIdFactory?.() ?? randomUUID(),
    updateId: ctx.update.update_id,
    updateType: resolveUpdateType(command, Boolean(ctx.callbackQuery)),
    command,
    callbackData,
    callbackNamespace,
    module: resolveInteractionModule(command, callbackNamespace, deps.commandModuleMap),
    userId: ctx.from?.id,
    chatId: ctx.chat?.id,
    responseCount: 0,
    startedAt: Date.now(),
  };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
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

interface ResponseFailure {
  deps: InteractionObserverDeps;
  trace: InteractionTrace;
  responseType: string;
  error: unknown;
}

function logResponseFailure(failure: ResponseFailure): void {
  const { deps, trace, responseType, error } = failure;
  deps.logger.error({
    code: 'bot-server.interaction_response_failed',
    ...toInteractionTraceLog(trace),
    responseType,
    status: 'failed',
    error: errorMessage(error),
  });
}

function observeResponses(
  ctx: Context,
  deps: InteractionObserverDeps,
  trace: InteractionTrace,
): void {
  const partial = ctx as Partial<
    Pick<Context, 'reply' | 'editMessageText' | 'answerCallbackQuery'>
  >;

  if (partial.reply) {
    const originalReply = partial.reply.bind(ctx);
    ctx.reply = (async (...args: Parameters<Context['reply']>) => {
      try {
        const result = await originalReply(...args);
        logResponse(deps, trace, 'reply');
        return result;
      } catch (error: unknown) {
        logResponseFailure({ deps, trace, responseType: 'reply', error });
        throw error;
      }
    }) as Context['reply'];
  }

  if (partial.editMessageText) {
    const originalEditMessageText = partial.editMessageText.bind(ctx);
    ctx.editMessageText = (async (...args: Parameters<Context['editMessageText']>) => {
      try {
        const result = await originalEditMessageText(...args);
        logResponse(deps, trace, 'editMessageText');
        return result;
      } catch (error: unknown) {
        logResponseFailure({ deps, trace, responseType: 'editMessageText', error });
        throw error;
      }
    }) as Context['editMessageText'];
  }

  if (partial.answerCallbackQuery) {
    const originalAnswerCallbackQuery = partial.answerCallbackQuery.bind(ctx);
    ctx.answerCallbackQuery = (async (...args: Parameters<Context['answerCallbackQuery']>) => {
      try {
        const result = await originalAnswerCallbackQuery(...args);
        logResponse(deps, trace, 'answerCallbackQuery');
        return result;
      } catch (error: unknown) {
        logResponseFailure({ deps, trace, responseType: 'answerCallbackQuery', error });
        throw error;
      }
    }) as Context['answerCallbackQuery'];
  }
}

export function createInteractionObserverMiddleware(
  deps: InteractionObserverDeps,
): (ctx: Context, next: NextFunction) => Promise<void> {
  return async (ctx: Context, next: NextFunction): Promise<void> => {
    const trace = buildTrace(ctx, deps);
    setInteractionTrace(ctx, trace);
    observeResponses(ctx, deps, trace);
    deps.logger.info({
      code: 'bot-server.interaction_received',
      ...toInteractionTraceLog(trace),
      status: 'received',
    });

    try {
      await next();
      deps.logger.info({
        code: 'bot-server.interaction_handled',
        ...toInteractionTraceLog(trace),
        status: 'handled',
        durationMs: Date.now() - trace.startedAt,
      });
    } catch (error: unknown) {
      deps.logger.error({
        code: 'bot-server.interaction_failed',
        ...toInteractionTraceLog(trace),
        status: 'failed',
        durationMs: Date.now() - trace.startedAt,
        error: errorMessage(error),
      });
      throw error;
    }
  };
}
