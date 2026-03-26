import { describe, it, expect, vi } from 'vitest';

vi.mock('@tempot/i18n-core', () => ({
  t: (key: string, options?: Record<string, unknown>) => {
    if (options) return `${key}:${JSON.stringify(options)}`;
    return key;
  },
}));

import {
  formatLoading,
  formatSuccess,
  formatError,
  formatWarning,
} from '../../src/messages/status.formatter.js';

describe('Status Formatter', () => {
  it('formatLoading should return string prefixed with hourglass', () => {
    const result = formatLoading({ key: 'invoice.processing' });
    expect(result).toBe('\u23F3 invoice.processing');
  });

  it('formatSuccess should return string prefixed with checkmark', () => {
    const result = formatSuccess({ key: 'invoice.created' });
    expect(result).toBe('\u2705 invoice.created');
  });

  it('formatError should return string prefixed with cross', () => {
    const result = formatError({ key: 'invoice.failed' });
    expect(result).toBe('\u274C invoice.failed');
  });

  it('formatWarning should return string prefixed with warning sign', () => {
    const result = formatWarning({ key: 'invoice.warning' });
    expect(result).toBe('\u26A0\uFE0F invoice.warning');
  });

  it('should pass interpolation to t()', () => {
    const result = formatSuccess({
      key: 'invoice.created',
      interpolation: { id: 42 },
    });
    expect(result).toContain('invoice.created');
    expect(result).toContain('"id":42');
  });
});
