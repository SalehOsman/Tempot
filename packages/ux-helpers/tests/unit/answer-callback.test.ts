import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UX_ERRORS } from '../../src/errors.js';

vi.mock('@tempot/logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

import { answerCallback } from '../../src/helpers/answer-callback.js';

function createMockCtx(overrides?: { answerError?: Error }) {
  return {
    answerCallbackQuery: vi.fn().mockImplementation(() => {
      if (overrides?.answerError) throw overrides.answerError;
      return Promise.resolve(true);
    }),
  };
}

describe('answerCallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call answerCallbackQuery with no options', async () => {
    const ctx = createMockCtx();
    const result = await answerCallback(ctx);

    expect(result.isOk()).toBe(true);
    expect(ctx.answerCallbackQuery).toHaveBeenCalledWith({
      text: undefined,
      show_alert: undefined,
    });
  });

  it('should pass text option to answerCallbackQuery', async () => {
    const ctx = createMockCtx();
    const result = await answerCallback(ctx, { text: 'Done!' });

    expect(result.isOk()).toBe(true);
    expect(ctx.answerCallbackQuery).toHaveBeenCalledWith({
      text: 'Done!',
      show_alert: undefined,
    });
  });

  it('should pass showAlert option to answerCallbackQuery', async () => {
    const ctx = createMockCtx();
    const result = await answerCallback(ctx, {
      text: 'Warning!',
      showAlert: true,
    });

    expect(result.isOk()).toBe(true);
    expect(ctx.answerCallbackQuery).toHaveBeenCalledWith({
      text: 'Warning!',
      show_alert: true,
    });
  });

  it('should return ok on "query is too old" error (timeout)', async () => {
    const error = new Error('Bad Request: query is too old and response url is not available');
    const ctx = createMockCtx({ answerError: error });

    const result = await answerCallback(ctx);

    expect(result.isOk()).toBe(true);
  });

  it('should return ok on "query ID is invalid" error (timeout)', async () => {
    const error = new Error('Bad Request: query ID is invalid');
    const ctx = createMockCtx({ answerError: error });

    const result = await answerCallback(ctx);

    expect(result.isOk()).toBe(true);
  });

  it('should return err with CALLBACK_QUERY_FAILED for other errors', async () => {
    const error = new Error('Some unexpected error');
    const ctx = createMockCtx({ answerError: error });

    const result = await answerCallback(ctx);

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe(UX_ERRORS.CALLBACK_QUERY_FAILED);
  });
});
