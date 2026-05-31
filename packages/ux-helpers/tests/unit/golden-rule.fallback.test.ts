import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UX_ERRORS } from '../../src/ux.errors.js';
import { ok } from 'neverthrow';
import {
  InteractionRecorder,
  createInteractionTrace,
  setInteractionRecorder,
  setInteractionTrace,
} from '@tempot/interaction-observability';

vi.mock('@tempot/logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

import { logger } from '@tempot/logger';
import { editOrSend } from '../../src/helpers/golden-rule.fallback.js';

function createMockCtx(overrides?: {
  editSuccess?: boolean;
  editError?: Error;
  replySuccess?: boolean;
  replyError?: Error;
  callbackQuery?: { data: string; message?: { message_id: number } } | null;
}) {
  const explicitlySet = overrides !== undefined && 'callbackQuery' in overrides;
  const callbackQuery = explicitlySet
    ? (overrides.callbackQuery ?? undefined)
    : { data: 'test', message: { message_id: 1 } };

  return {
    callbackQuery,
    answerCallbackQuery: vi.fn().mockResolvedValue(undefined),
    editMessageText: vi.fn().mockImplementation(() => {
      if (overrides?.editError) throw overrides.editError;
      if (overrides?.editSuccess === false) throw new Error('failed');
      return Promise.resolve(true);
    }),
    reply: vi.fn().mockImplementation(() => {
      if (overrides?.replyError) throw overrides.replyError;
      return Promise.resolve({ message_id: 2 });
    }),
  };
}

describe('editOrSend', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully edit message and return ok', async () => {
    const ctx = createMockCtx();
    const result = await editOrSend(ctx, { text: 'Hello' });

    expect(result.isOk()).toBe(true);
    expect(ctx.editMessageText).toHaveBeenCalledWith('Hello', {
      parse_mode: undefined,
      reply_markup: undefined,
    });
    expect(ctx.answerCallbackQuery).toHaveBeenCalledWith({
      text: undefined,
      show_alert: undefined,
    });
    expect(ctx.reply).not.toHaveBeenCalled();
  });

  it('should pass parseMode and replyMarkup to editMessageText', async () => {
    const ctx = createMockCtx();
    const mockMarkup = { inline_keyboard: [] };
    const result = await editOrSend(ctx, {
      text: 'Hello',
      parseMode: 'HTML',
      replyMarkup: mockMarkup as never,
    });

    expect(result.isOk()).toBe(true);
    expect(ctx.editMessageText).toHaveBeenCalledWith('Hello', {
      parse_mode: 'HTML',
      reply_markup: mockMarkup,
    });
  });

  it('should return ok on "message is not modified" error (no-op)', async () => {
    const error = new Error('Bad Request: message is not modified');
    const ctx = createMockCtx({ editError: error });

    const result = await editOrSend(ctx, {
      text: 'Hello',
      unchangedCallbackText: 'This screen is already open.',
    });

    expect(result.isOk()).toBe(true);
    expect(ctx.answerCallbackQuery).toHaveBeenCalledWith({
      text: 'This screen is already open.',
      show_alert: undefined,
    });
    expect(ctx.reply).not.toHaveBeenCalled();
  });

  it('records view, edit attempt, no-op, and callback answer interaction events', async () => {
    const error = new Error('Bad Request: message is not modified');
    const ctx = createMockCtx({ editError: error });
    const sink = { write: vi.fn().mockResolvedValue(ok(undefined)) };
    const recorder = new InteractionRecorder({
      sink,
      logger: { warn: vi.fn(), debug: vi.fn() },
    });
    setInteractionTrace(
      ctx,
      createInteractionTrace({
        traceId: 'trace-ux',
        updateType: 'callback_query',
        callbackData: 'settings:regional:timezone',
        callbackNamespace: 'settings',
        module: 'settings-management',
        startedAt: 1_000,
      }),
    );
    setInteractionRecorder(ctx, recorder);

    const result = await editOrSend(ctx, {
      text: 'Hello',
      viewKey: 'settings-management.view.regional_timezone',
      unchangedCallbackText: 'This screen is already open.',
    });

    expect(result.isOk()).toBe(true);
    expect(sink.write).toHaveBeenCalledWith(
      expect.objectContaining({
        stage: 'view_rendered',
        status: 'succeeded',
        viewKey: 'settings-management.view.regional_timezone',
      }),
    );
    expect(sink.write).toHaveBeenCalledWith(
      expect.objectContaining({
        stage: 'edit_attempted',
        status: 'attempted',
        viewKey: 'settings-management.view.regional_timezone',
      }),
    );
    expect(sink.write).toHaveBeenCalledWith(
      expect.objectContaining({
        stage: 'edit_noop',
        status: 'skipped',
        reason: 'message_not_modified',
      }),
    );
    expect(sink.write).toHaveBeenCalledWith(
      expect.objectContaining({
        stage: 'callback_answered',
        status: 'succeeded',
      }),
    );
  });

  it('should fallback to reply on "message to edit not found" and log warning', async () => {
    const error = new Error('Bad Request: message to edit not found');
    const ctx = createMockCtx({ editError: error });

    const result = await editOrSend(ctx, { text: 'Hello' });

    expect(result.isOk()).toBe(true);
    expect(ctx.reply).toHaveBeenCalledWith('Hello', {
      parse_mode: undefined,
      reply_markup: undefined,
    });
    expect(logger.warn).toHaveBeenCalled();
  });

  it('should fallback to reply on "message can\'t be edited" and log warning', async () => {
    const error = new Error("Bad Request: message can't be edited");
    const ctx = createMockCtx({ editError: error });

    const result = await editOrSend(ctx, { text: 'Hello' });

    expect(result.isOk()).toBe(true);
    expect(ctx.reply).toHaveBeenCalledWith('Hello', {
      parse_mode: undefined,
      reply_markup: undefined,
    });
    expect(logger.warn).toHaveBeenCalled();
  });

  it('should return err with MESSAGE_EDIT_FAILED for other edit errors', async () => {
    const error = new Error('Some unexpected Telegram error');
    const ctx = createMockCtx({ editError: error });

    const result = await editOrSend(ctx, { text: 'Hello' });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe(UX_ERRORS.MESSAGE_EDIT_FAILED);
    expect(ctx.reply).not.toHaveBeenCalled();
  });

  it('should use ctx.reply when no callback query exists', async () => {
    const ctx = createMockCtx({ callbackQuery: null });

    const result = await editOrSend(ctx, { text: 'Hello' });

    expect(result.isOk()).toBe(true);
    expect(ctx.editMessageText).not.toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledWith('Hello', {
      parse_mode: undefined,
      reply_markup: undefined,
    });
  });

  it('should use ctx.reply when callback query has no message', async () => {
    const ctx = createMockCtx({
      callbackQuery: { data: 'test' },
    });

    const result = await editOrSend(ctx, { text: 'Hello' });

    expect(result.isOk()).toBe(true);
    expect(ctx.editMessageText).not.toHaveBeenCalled();
    expect(ctx.reply).toHaveBeenCalledWith('Hello', {
      parse_mode: undefined,
      reply_markup: undefined,
    });
  });

  it('should return err with MESSAGE_SEND_FAILED when reply fails', async () => {
    const ctx = createMockCtx({
      callbackQuery: null,
      replyError: new Error('Reply failed'),
    });

    const result = await editOrSend(ctx, { text: 'Hello' });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe(UX_ERRORS.MESSAGE_SEND_FAILED);
  });

  it('should return err with MESSAGE_SEND_FAILED when fallback reply fails', async () => {
    const editError = new Error('Bad Request: message to edit not found');
    const replyError = new Error('Reply also failed');
    const ctx = createMockCtx({ editError, replyError });

    const result = await editOrSend(ctx, { text: 'Hello' });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe(UX_ERRORS.MESSAGE_SEND_FAILED);
  });
});
