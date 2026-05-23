import { ok, err } from 'neverthrow';
import type { AsyncResult } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import { logger } from '@tempot/logger';
import { getInteractionTrace, recordInteractionStep } from '@tempot/interaction-observability';
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

type ReplyStage = 'reply_sent' | 'fallback_reply_sent';

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
  stage: ReplyStage,
): AsyncResult<void, AppError> {
  try {
    await ctx.reply(options.text, {
      parse_mode: options.parseMode,
      reply_markup: options.replyMarkup,
    });
    await recordStep(ctx, {
      stage,
      status: 'succeeded',
      responseType: 'reply',
      viewKey: options.viewKey,
    });
    return ok(undefined);
  } catch (error: unknown) {
    await recordStep(ctx, {
      stage: 'response_failed',
      status: 'failed',
      responseType: 'reply',
      reason: 'telegram_response_failed',
      viewKey: options.viewKey,
      metadata: { error: error instanceof Error ? error.message : String(error) },
    });
    return err(new AppError(UX_ERRORS.MESSAGE_SEND_FAILED, { originalError: error }));
  }
}

async function recordStep(
  ctx: EditableContext,
  event: Parameters<typeof recordInteractionStep>[1],
): Promise<void> {
  const trace = getInteractionTrace(ctx);
  const result = await recordInteractionStep(ctx, {
    action: trace?.callbackData ?? trace?.command ?? 'message',
    ...event,
  });
  if (result.isErr()) {
    logger.warn({
      code: 'ux-helpers.interaction_event_record_failed',
      stage: event.stage,
      status: event.status,
      error: result.error.code,
    });
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

  await recordStep(ctx, {
    stage: 'view_rendered',
    status: 'succeeded',
    viewKey: options.viewKey,
  });

  if (!ctx.callbackQuery?.message) {
    return sendReply(ctx, options, 'reply_sent');
  }

  return editExistingMessage(ctx, options);
}

async function editExistingMessage(
  ctx: EditableContext,
  options: EditOrSendOptions,
): AsyncResult<void, AppError> {
  try {
    await recordStep(ctx, {
      stage: 'edit_attempted',
      status: 'attempted',
      responseType: 'editMessageText',
      viewKey: options.viewKey,
    });
    await ctx.editMessageText(options.text, {
      parse_mode: options.parseMode,
      reply_markup: options.replyMarkup,
    });
    await recordStep(ctx, {
      stage: 'edit_success',
      status: 'succeeded',
      responseType: 'editMessageText',
      viewKey: options.viewKey,
    });
    return answerIfNeeded(ctx);
  } catch (error: unknown) {
    if (isNoOpError(error)) {
      await recordStep(ctx, {
        stage: 'edit_noop',
        status: 'skipped',
        responseType: 'editMessageText',
        reason: 'message_not_modified',
        viewKey: options.viewKey,
      });
      return answerIfNeeded(ctx, options.unchangedCallbackText);
    }

    if (isFallbackError(error)) {
      logger.warn({ error }, 'Edit failed, falling back to reply');
      const replyResult = await sendReply(ctx, options, 'fallback_reply_sent');
      if (replyResult.isErr()) return replyResult;
      return answerIfNeeded(ctx);
    }

    await recordStep(ctx, {
      stage: 'response_failed',
      status: 'failed',
      responseType: 'editMessageText',
      reason: 'telegram_response_failed',
      viewKey: options.viewKey,
      metadata: { error: error instanceof Error ? error.message : String(error) },
    });
    return err(new AppError(UX_ERRORS.MESSAGE_EDIT_FAILED, { originalError: error }));
  }
}
