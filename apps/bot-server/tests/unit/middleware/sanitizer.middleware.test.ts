import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSanitizerMiddleware } from '../../../src/bot/middleware/sanitizer.middleware.js';

interface MockMessage {
  text?: string;
  caption?: string;
  from: { id: number };
}

interface MockUpdate {
  message?: MockMessage;
}

interface MockContext {
  update: MockUpdate;
  message?: MockMessage;
  from: { id: number };
  chat: { id: number };
  reply: ReturnType<typeof vi.fn>;
}

function createMockContext(overrides: Partial<MockContext> = {}): MockContext {
  const message: MockMessage = { text: 'test', from: { id: 123 } };
  return {
    update: { message },
    message,
    from: { id: 123 },
    chat: { id: 456 },
    reply: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('createSanitizerMiddleware', () => {
  let next: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    next = vi.fn().mockResolvedValue(undefined);
  });

  it('strips dangerous HTML content from ctx.update.message.text', async () => {
    const ctx = createMockContext();
    ctx.update.message!.text = '<script>alert("xss")</script>Hello';
    ctx.message = ctx.update.message;

    const middleware = createSanitizerMiddleware();
    await middleware(ctx as never, next);

    expect(ctx.update.message!.text).toBe('Hello');
    expect(next).toHaveBeenCalledOnce();
  });

  it('passes clean text through unchanged', async () => {
    const ctx = createMockContext();
    ctx.update.message!.text = 'Hello world';
    ctx.message = ctx.update.message;

    const middleware = createSanitizerMiddleware();
    await middleware(ctx as never, next);

    expect(ctx.update.message!.text).toBe('Hello world');
    expect(next).toHaveBeenCalledOnce();
  });

  it('handles messages without text field', async () => {
    const message: MockMessage = { from: { id: 123 } };
    const ctx = createMockContext({
      update: { message },
      message,
    });

    const middleware = createSanitizerMiddleware();
    await middleware(ctx as never, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('sanitizes caption field on messages', async () => {
    const message: MockMessage = {
      text: 'clean',
      caption: '<img onerror="hack()">photo',
      from: { id: 123 },
    };
    const ctx = createMockContext({
      update: { message },
      message,
    });

    const middleware = createSanitizerMiddleware();
    await middleware(ctx as never, next);

    expect(ctx.update.message!.caption).toBe('photo');
    expect(next).toHaveBeenCalledOnce();
  });
});
