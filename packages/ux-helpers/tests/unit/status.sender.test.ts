import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ok } from 'neverthrow';

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
import { formatLoading, formatSuccess } from '../../src/messages/status.formatter.js';
import { sendLoading, sendSuccess } from '../../src/messages/status.sender.js';

const mockEditOrSend = vi.mocked(editOrSend);
const mockFormatLoading = vi.mocked(formatLoading);
const mockFormatSuccess = vi.mocked(formatSuccess);

describe('status sender', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEditOrSend.mockResolvedValue(ok(undefined));
  });

  describe('sendLoading', () => {
    it('should format via formatLoading and send via editOrSend', async () => {
      mockFormatLoading.mockReturnValue('⏳ Loading...');

      const ctx = {};
      const result = await sendLoading(ctx, { key: 'common.loading' });

      expect(mockFormatLoading).toHaveBeenCalledWith({
        key: 'common.loading',
        interpolation: undefined,
      });
      expect(mockEditOrSend).toHaveBeenCalledWith(ctx, {
        text: '⏳ Loading...',
        replyMarkup: undefined,
      });
      expect(result.isOk()).toBe(true);
    });

    it('should pass keyboard as replyMarkup', async () => {
      mockFormatLoading.mockReturnValue('⏳ Loading...');
      const keyboard = { inline_keyboard: [] };

      const ctx = {};
      const result = await sendLoading(ctx, {
        key: 'common.loading',
        keyboard: keyboard as never,
      });

      expect(mockEditOrSend).toHaveBeenCalledWith(ctx, {
        text: '⏳ Loading...',
        replyMarkup: keyboard,
      });
      expect(result.isOk()).toBe(true);
    });

    it('should pass interpolation to formatter', async () => {
      mockFormatLoading.mockReturnValue('⏳ Loading items...');
      const interpolation = { count: 5 };

      const ctx = {};
      await sendLoading(ctx, { key: 'common.loading', interpolation });

      expect(mockFormatLoading).toHaveBeenCalledWith({
        key: 'common.loading',
        interpolation: { count: 5 },
      });
    });
  });

  describe('sendSuccess', () => {
    it('should format via formatSuccess and send via editOrSend', async () => {
      mockFormatSuccess.mockReturnValue('✅ Done!');

      const ctx = {};
      const result = await sendSuccess(ctx, { key: 'common.success' });

      expect(mockFormatSuccess).toHaveBeenCalledWith({
        key: 'common.success',
        interpolation: undefined,
      });
      expect(mockEditOrSend).toHaveBeenCalledWith(ctx, {
        text: '✅ Done!',
        replyMarkup: undefined,
      });
      expect(result.isOk()).toBe(true);
    });

    it('should pass keyboard as replyMarkup', async () => {
      mockFormatSuccess.mockReturnValue('✅ Done!');
      const keyboard = { inline_keyboard: [] };

      const ctx = {};
      const result = await sendSuccess(ctx, {
        key: 'common.success',
        keyboard: keyboard as never,
      });

      expect(mockEditOrSend).toHaveBeenCalledWith(ctx, {
        text: '✅ Done!',
        replyMarkup: keyboard,
      });
      expect(result.isOk()).toBe(true);
    });
  });
});
