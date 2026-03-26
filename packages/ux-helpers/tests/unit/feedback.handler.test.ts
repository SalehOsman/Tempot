import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';

vi.mock('../../src/messages/status.sender.js', () => ({
  sendLoading: vi.fn(),
  sendSuccess: vi.fn(),
  sendError: vi.fn(),
  sendWarning: vi.fn(),
}));

import { sendLoading, sendSuccess, sendError } from '../../src/messages/status.sender.js';
import { executeFeedback } from '../../src/feedback/feedback.handler.js';

const mockSendLoading = vi.mocked(sendLoading);
const mockSendSuccess = vi.mocked(sendSuccess);
const mockSendError = vi.mocked(sendError);

describe('feedback handler', () => {
  const ctx = {};

  beforeEach(() => {
    vi.clearAllMocks();
    mockSendLoading.mockResolvedValue(ok(undefined));
    mockSendSuccess.mockResolvedValue(ok(undefined));
    mockSendError.mockResolvedValue(ok(undefined));
  });

  describe('successful action', () => {
    it('should show loading, execute action, and show success', async () => {
      const actionResult = { id: 1, name: 'test' };
      const action = vi.fn().mockResolvedValue(ok(actionResult));

      const result = await executeFeedback(ctx, {
        loadingKey: 'tasks.creating',
        action,
        successKey: 'tasks.created',
      });

      expect(mockSendLoading).toHaveBeenCalledWith(ctx, {
        key: 'tasks.creating',
      });
      expect(action).toHaveBeenCalledOnce();
      expect(mockSendSuccess).toHaveBeenCalledWith(ctx, {
        key: 'tasks.created',
        keyboard: undefined,
      });
      expect(mockSendError).not.toHaveBeenCalled();
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(actionResult);
    });

    it('should return the action result value (generic T)', async () => {
      const data = { userId: 42, status: 'active' as const };
      const action = vi.fn().mockResolvedValue(ok(data));

      const result = await executeFeedback(ctx, {
        loadingKey: 'users.loading',
        action,
        successKey: 'users.loaded',
      });

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(data);
    });
  });

  describe('failed action', () => {
    it('should show loading, execute action, and show error on failure', async () => {
      const appError = new AppError('TASK_NOT_FOUND');
      const action = vi.fn().mockResolvedValue(err(appError));

      const result = await executeFeedback(ctx, {
        loadingKey: 'tasks.creating',
        action,
        successKey: 'tasks.created',
      });

      expect(mockSendLoading).toHaveBeenCalledWith(ctx, {
        key: 'tasks.creating',
      });
      expect(action).toHaveBeenCalledOnce();
      expect(mockSendError).toHaveBeenCalledWith(ctx, {
        key: 'errors.TASK_NOT_FOUND',
      });
      expect(mockSendSuccess).not.toHaveBeenCalled();
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBe(appError);
    });

    it('should format error key as errors.{code}', async () => {
      const appError = new AppError('AUTH_UNAUTHORIZED');
      const action = vi.fn().mockResolvedValue(err(appError));

      await executeFeedback(ctx, {
        loadingKey: 'auth.checking',
        action,
        successKey: 'auth.success',
      });

      expect(mockSendError).toHaveBeenCalledWith(ctx, {
        key: 'errors.AUTH_UNAUTHORIZED',
      });
    });
  });

  describe('keyboard passthrough', () => {
    it('should pass keyboard to sendSuccess on success', async () => {
      const keyboard = { inline_keyboard: [[]] };
      const action = vi.fn().mockResolvedValue(ok('done'));

      await executeFeedback(ctx, {
        loadingKey: 'tasks.saving',
        action,
        successKey: 'tasks.saved',
        keyboard: keyboard as never,
      });

      expect(mockSendSuccess).toHaveBeenCalledWith(ctx, {
        key: 'tasks.saved',
        keyboard,
      });
    });

    it('should not pass keyboard to sendError on failure', async () => {
      const keyboard = { inline_keyboard: [[]] };
      const appError = new AppError('SAVE_FAILED');
      const action = vi.fn().mockResolvedValue(err(appError));

      await executeFeedback(ctx, {
        loadingKey: 'tasks.saving',
        action,
        successKey: 'tasks.saved',
        keyboard: keyboard as never,
      });

      expect(mockSendError).toHaveBeenCalledWith(ctx, {
        key: 'errors.SAVE_FAILED',
      });
    });
  });

  describe('execution order', () => {
    it('should call sendLoading before executing the action', async () => {
      const callOrder: string[] = [];

      mockSendLoading.mockImplementation(async () => {
        callOrder.push('loading');
        return ok(undefined);
      });

      const action = vi.fn().mockImplementation(async () => {
        callOrder.push('action');
        return ok('result');
      });

      await executeFeedback(ctx, {
        loadingKey: 'op.loading',
        action,
        successKey: 'op.done',
      });

      expect(callOrder).toEqual(['loading', 'action']);
    });
  });
});
