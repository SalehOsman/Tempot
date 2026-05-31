import type { Context, NextFunction } from 'grammy';
import { randomUUID } from 'node:crypto';
import {
  extractCallbackNamespace,
  extractCommand,
  resolveInteractionModule,
  resolveUpdateType,
} from '../interaction-routing.js';
import {
  createInteractionTrace,
  setInteractionRecorder,
  setInteractionTrace,
  toInteractionTraceLog,
  type InteractionTrace,
} from '@tempot/interaction-observability';
import type { InteractionObserverDeps } from './interaction-observer.types.js';
import {
  errorMessage,
  interactionAction,
  observeResponses,
  recordObserverStep,
} from './interaction-response.observer.js';

function buildTrace(ctx: Context, deps: InteractionObserverDeps): InteractionTrace {
  const command = extractCommand(ctx.message?.text);
  const callbackData = ctx.callbackQuery?.data;
  const callbackNamespace = extractCallbackNamespace(callbackData);
  return createInteractionTrace({
    traceId: deps.traceIdFactory?.() ?? randomUUID(),
    updateId: ctx.update.update_id,
    updateType: resolveUpdateType(command, Boolean(ctx.callbackQuery)),
    command,
    callbackData,
    callbackNamespace,
    module: resolveInteractionModule(command, callbackNamespace, deps.commandModuleMap),
    userId: ctx.from?.id,
    chatId: ctx.chat?.id,
  });
}

export function createInteractionObserverMiddleware(
  deps: InteractionObserverDeps,
): (ctx: Context, next: NextFunction) => Promise<void> {
  return async (ctx: Context, next: NextFunction): Promise<void> => {
    const trace = buildTrace(ctx, deps);
    setInteractionTrace(ctx, trace);
    if (deps.interactionRecorder) setInteractionRecorder(ctx, deps.interactionRecorder);
    observeResponses(ctx, deps, trace);
    deps.logger.info({
      code: 'bot-server.interaction_received',
      ...toInteractionTraceLog(trace),
      status: 'received',
    });
    await recordObserverStep(deps, trace, {
      stage: 'received',
      status: 'received',
      action: interactionAction(trace),
    });

    try {
      await next();
      await handleCompleted(deps, trace);
    } catch (error: unknown) {
      await handleFailed(deps, trace, error);
      throw error;
    }
  };
}

async function handleCompleted(
  deps: InteractionObserverDeps,
  trace: InteractionTrace,
): Promise<void> {
  deps.logger.info({
    code: 'bot-server.interaction_handled',
    ...toInteractionTraceLog(trace),
    status: 'handled',
    durationMs: Date.now() - trace.startedAt,
  });
  await recordObserverStep(deps, trace, {
    stage: 'completed',
    status: 'completed',
    action: interactionAction(trace),
    metadata: { durationMs: Date.now() - trace.startedAt },
  });
}

async function handleFailed(
  deps: InteractionObserverDeps,
  trace: InteractionTrace,
  error: unknown,
): Promise<void> {
  deps.logger.error({
    code: 'bot-server.interaction_failed',
    ...toInteractionTraceLog(trace),
    status: 'failed',
    durationMs: Date.now() - trace.startedAt,
    error: errorMessage(error),
  });
  await recordObserverStep(deps, trace, {
    stage: 'failed',
    status: 'failed',
    action: interactionAction(trace),
    reason: 'handler_failed',
    metadata: {
      durationMs: Date.now() - trace.startedAt,
      error: errorMessage(error),
    },
  });
}
