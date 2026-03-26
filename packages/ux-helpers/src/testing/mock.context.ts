import type { MockContextOptions, MockContextCalls } from '../types.js';

interface TrackedFn {
  (...args: unknown[]): Promise<unknown>;
  calls: unknown[][];
  reset: () => void;
}

function createTrackedFn(returnValue: unknown = true): TrackedFn {
  const calls: unknown[][] = [];
  const fn = ((...args: unknown[]) => {
    calls.push(args);
    return Promise.resolve(returnValue);
  }) as TrackedFn;
  fn.calls = calls;
  fn.reset = () => {
    calls.length = 0;
  };
  return fn;
}

export function createMockContext(options?: MockContextOptions) {
  const chatId = options?.chatId ?? 123;
  const messageId = options?.messageId ?? 1;

  const editMessageText = createTrackedFn(true);
  const reply = createTrackedFn({ message_id: messageId + 1 });
  const answerCallbackQuery = createTrackedFn(true);
  const replyWithChatAction = createTrackedFn(true);

  const calls: MockContextCalls = {
    editMessageText: editMessageText.calls,
    reply: reply.calls,
    answerCallbackQuery: answerCallbackQuery.calls,
    replyWithChatAction: replyWithChatAction.calls,
  };

  return {
    chat: { id: chatId, type: 'private' as const },
    message: { message_id: messageId },
    callbackQuery: options?.callbackData
      ? { data: options.callbackData, message: { message_id: messageId } }
      : undefined,
    from: { id: options?.userId ?? 456 },
    editMessageText,
    reply,
    answerCallbackQuery,
    replyWithChatAction,
    calls,
  };
}
