import type { Context, NextFunction } from 'grammy';

interface CallbackFallbackLogger {
  warn: (data: object) => void;
}

export interface CallbackFallbackDeps {
  logger: CallbackFallbackLogger;
  t: (key: string, options?: Record<string, unknown>) => string;
}

function extractCallbackNamespace(callbackData: string | undefined): string | undefined {
  if (!callbackData) return undefined;
  const separatorIndex = callbackData.search(/[:.]/);
  if (separatorIndex <= 0) return callbackData;
  return callbackData.slice(0, separatorIndex);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function answerCallback(ctx: Context, deps: CallbackFallbackDeps): Promise<void> {
  try {
    await ctx.answerCallbackQuery();
  } catch (error: unknown) {
    deps.logger.warn({
      code: 'bot-server.callback_answer_failed',
      error: errorMessage(error),
    });
  }
}

export function createCallbackFallbackMiddleware(
  deps: CallbackFallbackDeps,
): (ctx: Context, next: NextFunction) => Promise<void> {
  return async (ctx: Context, next: NextFunction): Promise<void> => {
    if (!ctx.callbackQuery) {
      await next();
      return;
    }

    const callbackData = ctx.callbackQuery.data;
    deps.logger.warn({
      code: 'bot-server.callback_unhandled',
      callbackData,
      callbackNamespace: extractCallbackNamespace(callbackData),
      userId: ctx.from?.id,
      chatId: ctx.chat?.id,
    });

    await answerCallback(ctx, deps);
    await ctx.reply(deps.t('bot-server.callback_unhandled'));
  };
}
