import type { Context, NextFunction } from 'grammy';

interface ObserverLogger {
  info: (data: object) => void;
  error: (data: object) => void;
}

export interface InteractionObserverDeps {
  logger: ObserverLogger;
  commandModuleMap?: Record<string, string>;
}

interface InteractionMetadata {
  updateId?: number;
  updateType: string;
  command?: string;
  callbackData?: string;
  callbackNamespace?: string;
  module: string;
  userId?: number;
  chatId?: number;
}

const CALLBACK_NAMESPACE_MODULES: Record<string, string> = {
  botmgmt: 'bot-management',
  ie: 'input-engine',
  tmpl: 'template-management',
};

function extractCommand(ctx: Context): string | undefined {
  const text = ctx.message?.text;
  if (!text?.startsWith('/')) return undefined;
  return text.split(' ')[0];
}

function extractCallbackNamespace(callbackData: string | undefined): string | undefined {
  if (!callbackData) return undefined;
  const separatorIndex = callbackData.search(/[:.]/);
  if (separatorIndex <= 0) return callbackData;
  return callbackData.slice(0, separatorIndex);
}

function resolveModule(
  command: string | undefined,
  callbackNamespace: string | undefined,
  commandModuleMap: Record<string, string> | undefined,
): string {
  if (command) return commandModuleMap?.[command] ?? 'bot-server';
  if (callbackNamespace) return CALLBACK_NAMESPACE_MODULES[callbackNamespace] ?? callbackNamespace;
  return 'bot-server';
}

function buildMetadata(ctx: Context, deps: InteractionObserverDeps): InteractionMetadata {
  const command = extractCommand(ctx);
  const callbackData = ctx.callbackQuery?.data;
  const callbackNamespace = extractCallbackNamespace(callbackData);
  const updateType = command ? 'command' : ctx.callbackQuery ? 'callback_query' : 'message';
  return {
    updateId: ctx.update.update_id,
    updateType,
    command,
    callbackData,
    callbackNamespace,
    module: resolveModule(command, callbackNamespace, deps.commandModuleMap),
    userId: ctx.from?.id,
    chatId: ctx.chat?.id,
  };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function createInteractionObserverMiddleware(
  deps: InteractionObserverDeps,
): (ctx: Context, next: NextFunction) => Promise<void> {
  return async (ctx: Context, next: NextFunction): Promise<void> => {
    const metadata = buildMetadata(ctx, deps);
    const start = Date.now();
    deps.logger.info({ code: 'bot-server.interaction_received', ...metadata, status: 'received' });

    try {
      await next();
      deps.logger.info({
        code: 'bot-server.interaction_handled',
        ...metadata,
        status: 'handled',
        durationMs: Date.now() - start,
      });
    } catch (error: unknown) {
      deps.logger.error({
        code: 'bot-server.interaction_failed',
        ...metadata,
        status: 'failed',
        durationMs: Date.now() - start,
        error: errorMessage(error),
      });
      throw error;
    }
  };
}
