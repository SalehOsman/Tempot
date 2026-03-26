import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@tempot/logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

import { logger } from '@tempot/logger';
import { showTyping } from '../../src/helpers/typing.indicator.js';

function createMockCtx(overrides?: { typingError?: Error }) {
  return {
    replyWithChatAction: vi.fn().mockImplementation(() => {
      if (overrides?.typingError) throw overrides.typingError;
      return Promise.resolve(true);
    }),
  };
}

describe('showTyping', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call replyWithChatAction with typing', async () => {
    const ctx = createMockCtx();
    const result = await showTyping(ctx);

    expect(result.isOk()).toBe(true);
    expect(ctx.replyWithChatAction).toHaveBeenCalledWith('typing');
  });

  it('should return ok even when replyWithChatAction throws', async () => {
    const error = new Error('Chat action not supported');
    const ctx = createMockCtx({ typingError: error });

    const result = await showTyping(ctx);

    expect(result.isOk()).toBe(true);
  });

  it('should log warning when replyWithChatAction fails', async () => {
    const error = new Error('Chat action not supported');
    const ctx = createMockCtx({ typingError: error });

    await showTyping(ctx);

    expect(logger.warn).toHaveBeenCalled();
  });

  it('should return ok on forbidden error for unsupported chat types', async () => {
    const error = new Error('Forbidden: bot was blocked by the user');
    const ctx = createMockCtx({ typingError: error });

    const result = await showTyping(ctx);

    expect(result.isOk()).toBe(true);
    expect(logger.warn).toHaveBeenCalled();
  });

  it('should not throw on any error type', async () => {
    const error = new Error('Network error');
    const ctx = createMockCtx({ typingError: error });

    const result = await showTyping(ctx);

    expect(result.isOk()).toBe(true);
  });
});
