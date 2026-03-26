import { describe, it, expect, vi } from 'vitest';

vi.mock('@tempot/i18n-core', () => ({
  t: (key: string, options?: Record<string, unknown>) => {
    if (options) return `${key}:${JSON.stringify(options)}`;
    return key;
  },
}));

import {
  formatUserError,
  formatSystemError,
  formatPermissionError,
  formatSessionExpired,
} from '../../src/messages/error.formatter.js';

describe('Error Formatter', () => {
  describe('formatUserError', () => {
    it('should format with error emoji, problem, and solution', () => {
      const result = formatUserError({
        problemKey: 'invoice.invalid_date',
        solutionKey: 'invoice.use_format',
      });
      expect(result).toBe('\u274C invoice.invalid_date\ninvoice.use_format');
    });

    it('should pass interpolation to both problem and solution', () => {
      const result = formatUserError({
        problemKey: 'invoice.amount_exceeded',
        solutionKey: 'invoice.max_amount',
        interpolation: { max: 1000 },
      });
      expect(result).toContain('invoice.amount_exceeded');
      expect(result).toContain('"max":1000');
    });
  });

  describe('formatSystemError', () => {
    it('should format with generic system message and reference code', () => {
      const result = formatSystemError({
        referenceCode: 'ERR-20260321-ABCD',
      });
      expect(result).toContain('\u274C');
      expect(result).toContain('common.errors.system');
      expect(result).toContain('ERR-20260321-ABCD');
    });
  });

  describe('formatPermissionError', () => {
    it('should format with error emoji and denial reason', () => {
      const result = formatPermissionError({
        reasonKey: 'auth.no_edit_permission',
      });
      expect(result).toBe('\u274C auth.no_edit_permission');
    });
  });

  describe('formatSessionExpired', () => {
    it('should return text and restart button config', () => {
      const result = formatSessionExpired({
        restartCallbackData: 'restart:session',
      });
      expect(result.text).toBe('common.errors.session_expired');
      expect(result.restartButton.label).toBe('common.errors.session_expired_restart');
      expect(result.restartButton.callbackData).toBe('restart:session');
    });
  });
});
