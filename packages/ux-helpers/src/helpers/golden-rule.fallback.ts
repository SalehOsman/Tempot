import { ok, err } from 'neverthrow';
import type { AsyncResult } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import { logger } from '@tempot/logger';
import type { EditOrSendOptions } from '../ux.types.js';
import { UX_ERRORS } from '../ux.errors.js';
import { uxToggle } from '../ux.toggle.js';
import { answerCallback } from './callback.handler.js';

interface EditableContext {
  readonly callbackQuery?: { readonly message?: unknown };
  answerCallbackQuery?(options: {
    readonly text?: string;
    readonly show_alert?: boolean;
  }): Promise<unknown>;
  editMessageText(text: string, options: EditMessageOptions): Promise<unknown>;
  reply(text: string, options: ReplyOptions): Promise<unknown>;
}

interface EditMessageOptions {
  readonly parse_mode?: string;
  readonly reply_markup?: unknown;
}

interface ReplyOptions {
  readonly parse_mode?: string;
  readonly reply_markup?: unknown;
}

function isNoOpError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : '';
  return message.includes('message is not modified');
}

function isFallbackError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : '';
  return (
    message.includes('message to edit not found') || message.includes("message can't be edited")
  );
}

async function sendReply(
  ctx: EditableContext,
  options: EditOrSendOptions,
): AsyncResult<void, AppError> {
  try {
    await ctx.reply(options.text, {
      parse_mode: options.parseMode,
      reply_markup: options.replyMarkup,
    });
    return ok(undefined);
  } catch (error: unknown) {
    return err(new AppError(UX_ERRORS.MESSAGE_SEND_FAILED, { originalError: error }));
  }
}

async function answerIfNeeded(ctx: EditableContext, text?: string): AsyncResult<void, AppError> {
  if (!ctx.callbackQuery || !ctx.answerCallbackQuery) return ok(undefined);
  return answerCallback(ctx as Parameters<typeof answerCallback>[0], { text });
}

/** Edit message if possible, otherwise fall back to reply (Golden Rule) */
export async function editOrSend(
  ctx: EditableContext,
  options: EditOrSendOptions,
): AsyncResult<void, AppError> {
  const disabled = uxToggle.check();
  if (disabled) return disabled;

  if (!ctx.callbackQuery?.message) {
    return sendReply(ctx, options);
  }

  try {
    await ctx.editMessageText(options.text, {
      parse_mode: options.parseMode,
      reply_markup: options.replyMarkup,
    });
    return answerIfNeeded(ctx);
  } catch (error: unknown) {
    if (isNoOpError(error)) {
      return answerIfNeeded(ctx, options.unchangedCallbackText);
    }

    if (isFallbackError(error)) {
      logger.warn({ error }, 'Edit failed, falling back to reply');
      const replyResult = await sendReply(ctx, options);
      if (replyResult.isErr()) return replyResult;
      return answerIfNeeded(ctx);
    }

    return err(new AppError(UX_ERRORS.MESSAGE_EDIT_FAILED, { originalError: error }));
  }
}
