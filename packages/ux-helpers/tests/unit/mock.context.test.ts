import { describe, it, expect } from 'vitest';
import { createMockContext } from '../../src/testing/mock.context.js';

describe('createMockContext', () => {
  describe('tracked methods', () => {
    it('should return object with editMessageText method', () => {
      const ctx = createMockContext();
      expect(typeof ctx.editMessageText).toBe('function');
    });

    it('should return object with reply method', () => {
      const ctx = createMockContext();
      expect(typeof ctx.reply).toBe('function');
    });

    it('should return object with answerCallbackQuery method', () => {
      const ctx = createMockContext();
      expect(typeof ctx.answerCallbackQuery).toBe('function');
    });

    it('should return object with replyWithChatAction method', () => {
      const ctx = createMockContext();
      expect(typeof ctx.replyWithChatAction).toBe('function');
    });

    it('should return tracked methods that resolve promises', async () => {
      const ctx = createMockContext();

      const editResult = ctx.editMessageText('text');
      const replyResult = ctx.reply('text');
      const answerResult = ctx.answerCallbackQuery();
      const actionResult = ctx.replyWithChatAction('typing');

      expect(editResult).toBeInstanceOf(Promise);
      expect(replyResult).toBeInstanceOf(Promise);
      expect(answerResult).toBeInstanceOf(Promise);
      expect(actionResult).toBeInstanceOf(Promise);

      await expect(editResult).resolves.toBeDefined();
      await expect(replyResult).resolves.toBeDefined();
      await expect(answerResult).resolves.toBeDefined();
      await expect(actionResult).resolves.toBeDefined();
    });
  });

  describe('default values', () => {
    it('should default chatId to 123', () => {
      const ctx = createMockContext();
      expect(ctx.chat.id).toBe(123);
    });

    it('should default chat type to private', () => {
      const ctx = createMockContext();
      expect(ctx.chat.type).toBe('private');
    });

    it('should default messageId to 1', () => {
      const ctx = createMockContext();
      expect(ctx.message?.message_id).toBe(1);
    });

    it('should default userId to 456', () => {
      const ctx = createMockContext();
      expect(ctx.from.id).toBe(456);
    });
  });

  describe('custom options', () => {
    it('should use custom chatId', () => {
      const ctx = createMockContext({ chatId: 999 });
      expect(ctx.chat.id).toBe(999);
    });

    it('should use custom messageId', () => {
      const ctx = createMockContext({ messageId: 42 });
      expect(ctx.message?.message_id).toBe(42);
    });

    it('should use custom userId', () => {
      const ctx = createMockContext({ userId: 789 });
      expect(ctx.from.id).toBe(789);
    });
  });

  describe('callbackQuery', () => {
    it('should set callbackQuery with data when callbackData provided', () => {
      const ctx = createMockContext({ callbackData: 'action:123' });
      expect(ctx.callbackQuery).toBeDefined();
      expect(ctx.callbackQuery?.data).toBe('action:123');
    });

    it('should include message in callbackQuery when callbackData provided', () => {
      const ctx = createMockContext({
        callbackData: 'action:123',
        messageId: 5,
      });
      expect(ctx.callbackQuery?.message).toBeDefined();
      expect(ctx.callbackQuery?.message?.message_id).toBe(5);
    });

    it('should set callbackQuery to undefined when no callbackData', () => {
      const ctx = createMockContext();
      expect(ctx.callbackQuery).toBeUndefined();
    });
  });

  describe('call tracking', () => {
    it('should have calls property with arrays for each method', () => {
      const ctx = createMockContext();
      expect(ctx.calls.editMessageText).toEqual([]);
      expect(ctx.calls.reply).toEqual([]);
      expect(ctx.calls.answerCallbackQuery).toEqual([]);
      expect(ctx.calls.replyWithChatAction).toEqual([]);
    });

    it('should track editMessageText invocations', async () => {
      const ctx = createMockContext();
      await ctx.editMessageText('hello', { parse_mode: 'HTML' });

      expect(ctx.calls.editMessageText).toHaveLength(1);
      expect(ctx.calls.editMessageText[0]).toEqual(['hello', { parse_mode: 'HTML' }]);
    });

    it('should track reply invocations', async () => {
      const ctx = createMockContext();
      await ctx.reply('world');

      expect(ctx.calls.reply).toHaveLength(1);
      expect(ctx.calls.reply[0]).toEqual(['world']);
    });

    it('should track multiple calls in order', async () => {
      const ctx = createMockContext();
      await ctx.reply('first');
      await ctx.reply('second');
      await ctx.reply('third');

      expect(ctx.calls.reply).toHaveLength(3);
      expect(ctx.calls.reply[0]).toEqual(['first']);
      expect(ctx.calls.reply[1]).toEqual(['second']);
      expect(ctx.calls.reply[2]).toEqual(['third']);
    });

    it('should track calls independently per method', async () => {
      const ctx = createMockContext();
      await ctx.editMessageText('edit');
      await ctx.reply('reply');

      expect(ctx.calls.editMessageText).toHaveLength(1);
      expect(ctx.calls.reply).toHaveLength(1);
      expect(ctx.calls.answerCallbackQuery).toHaveLength(0);
      expect(ctx.calls.replyWithChatAction).toHaveLength(0);
    });
  });

  describe('reset', () => {
    it('should clear calls when reset is called on editMessageText', async () => {
      const ctx = createMockContext();
      await ctx.editMessageText('hello');
      expect(ctx.calls.editMessageText).toHaveLength(1);

      ctx.editMessageText.reset();
      expect(ctx.calls.editMessageText).toHaveLength(0);
    });

    it('should clear calls when reset is called on reply', async () => {
      const ctx = createMockContext();
      await ctx.reply('hello');
      expect(ctx.calls.reply).toHaveLength(1);

      ctx.reply.reset();
      expect(ctx.calls.reply).toHaveLength(0);
    });

    it('should clear calls when reset is called on answerCallbackQuery', async () => {
      const ctx = createMockContext();
      await ctx.answerCallbackQuery();
      expect(ctx.calls.answerCallbackQuery).toHaveLength(1);

      ctx.answerCallbackQuery.reset();
      expect(ctx.calls.answerCallbackQuery).toHaveLength(0);
    });

    it('should clear calls when reset is called on replyWithChatAction', async () => {
      const ctx = createMockContext();
      await ctx.replyWithChatAction('typing');
      expect(ctx.calls.replyWithChatAction).toHaveLength(1);

      ctx.replyWithChatAction.reset();
      expect(ctx.calls.replyWithChatAction).toHaveLength(0);
    });
  });
});
