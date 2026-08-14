import type { Context, NextFunction } from 'grammy';
import { validateCommand } from './validation.registry.js';

export interface ValidationDeps {
  logger: { warn: (data: unknown) => void };
  t: (key: string) => string;
}

/**
 * Creates validation middleware per DC-9.
 * Schemas are registered per-command by modules via registerCommandSchema().
 * Commands with no registered schema pass through unchanged.
 */
export function createValidationMiddleware(
  deps: ValidationDeps,
): (ctx: Context, next: NextFunction) => Promise<void> {
  return async (ctx: Context, next: NextFunction): Promise<void> => {
    const command = ctx.message?.text?.match(/^\/(\w+)/)?.[1];
    if (!command) {
      await next();
      return;
    }

    const result = validateCommand(command, ctx);
    if (result === null) {
      await next();
      return;
    }

    if (!result.success) {
      deps.logger.warn({ msg: 'bot-server.validation_failed', command, error: result.error });
      try {
        await ctx.reply(deps.t('bot-server.validation_failed'));
      } catch (replyError: unknown) {
        deps.logger.warn({
          msg: 'bot-server.validation_reply_failed',
          error: replyError instanceof Error ? replyError.message : 'unknown',
        });
      }
      return;
    }

    await next();
  };
}
