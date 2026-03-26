import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';

vi.mock('../../src/helpers/golden-rule.fallback.js', () => ({
  editOrSend: vi.fn(),
}));

vi.mock('../../src/messages/status.formatter.js', () => ({
  formatLoading: vi.fn(),
  formatSuccess: vi.fn(),
  formatError: vi.fn(),
  formatWarning: vi.fn(),
}));

import { editOrSend } from '../../src/helpers/golden-rule.fallback.js';
import {
  formatLoading,
  formatSuccess,
  formatError,
  formatWarning,
} from '../../src/messages/status.formatter.js';
import {
  sendLoading,
  sendSuccess,
  sendError,
  sendWarning,
} from '../../src/messages/status.sender.js';

const mockEditOrSend = vi.mocked(editOrSend);
const mockFormatLoading = vi.mocked(formatLoading);
const mockFormatSuccess = vi.mocked(formatSuccess);
const mockFormatError = vi.mocked(formatError);
const mockFormatWarning = vi.mocked(formatWarning);

describe('status sender errors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEditOrSend.mockResolvedValue(ok(undefined));
  });

  describe('sendError', () => {
    it('should format via formatError and send via editOrSend', async () => {
      mockFormatError.mockReturnValue('❌ Failed!');

      const ctx = {};
      const result = await sendError(ctx, { key: 'common.error' });

      expect(mockFormatError).toHaveBeenCalledWith({
        key: 'common.error',
        interpolation: undefined,
      });
      expect(mockEditOrSend).toHaveBeenCalledWith(ctx, {
        text: '❌ Failed!',
        replyMarkup: undefined,
      });
      expect(result.isOk()).toBe(true);
    });

    it('should pass keyboard as replyMarkup', async () => {
      mockFormatError.mockReturnValue('❌ Failed!');
      const keyboard = { inline_keyboard: [] };

      const ctx = {};
      const result = await sendError(ctx, {
        key: 'common.error',
        keyboard: keyboard as never,
      });

      expect(mockEditOrSend).toHaveBeenCalledWith(ctx, {
        text: '❌ Failed!',
        replyMarkup: keyboard,
      });
      expect(result.isOk()).toBe(true);
    });
  });

  describe('sendWarning', () => {
    it('should format via formatWarning and send via editOrSend', async () => {
      mockFormatWarning.mockReturnValue('⚠️ Warning!');

      const ctx = {};
      const result = await sendWarning(ctx, { key: 'common.warning' });

      expect(mockFormatWarning).toHaveBeenCalledWith({
        key: 'common.warning',
        interpolation: undefined,
      });
      expect(mockEditOrSend).toHaveBeenCalledWith(ctx, {
        text: '⚠️ Warning!',
        replyMarkup: undefined,
      });
      expect(result.isOk()).toBe(true);
    });

    it('should pass keyboard as replyMarkup', async () => {
      mockFormatWarning.mockReturnValue('⚠️ Warning!');
      const keyboard = { inline_keyboard: [] };

      const ctx = {};
      const result = await sendWarning(ctx, {
        key: 'common.warning',
        keyboard: keyboard as never,
      });

      expect(mockEditOrSend).toHaveBeenCalledWith(ctx, {
        text: '⚠️ Warning!',
        replyMarkup: keyboard,
      });
      expect(result.isOk()).toBe(true);
    });
  });

  describe('error propagation', () => {
    it('should propagate error from editOrSend', async () => {
      const appError = new AppError('UX_SEND_FAILED');
      mockFormatLoading.mockReturnValue('⏳ Loading...');
      mockEditOrSend.mockResolvedValue(err(appError));

      const ctx = {};
      const result = await sendLoading(ctx, { key: 'common.loading' });

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBe(appError);
    });

    it('should propagate error for sendSuccess', async () => {
      const appError = new AppError('UX_SEND_FAILED');
      mockFormatSuccess.mockReturnValue('✅ Done!');
      mockEditOrSend.mockResolvedValue(err(appError));

      const ctx = {};
      const result = await sendSuccess(ctx, { key: 'common.success' });

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBe(appError);
    });

    it('should propagate error for sendError', async () => {
      const appError = new AppError('UX_SEND_FAILED');
      mockFormatError.mockReturnValue('❌ Failed!');
      mockEditOrSend.mockResolvedValue(err(appError));

      const ctx = {};
      const result = await sendError(ctx, { key: 'common.error' });

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBe(appError);
    });

    it('should propagate error for sendWarning', async () => {
      const appError = new AppError('UX_SEND_FAILED');
      mockFormatWarning.mockReturnValue('⚠️ Warning!');
      mockEditOrSend.mockResolvedValue(err(appError));

      const ctx = {};
      const result = await sendWarning(ctx, { key: 'common.warning' });

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBe(appError);
    });
  });
});
