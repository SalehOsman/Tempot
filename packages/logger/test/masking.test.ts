import { describe, it, expect } from 'vitest';
import { maskSensitiveString, SENSITIVE_REDACTION_PATHS } from '../src/masking.js';

describe('Logger PII Redaction & Masking Specification', () => {
  it('masks sensitive phone and card digits preserving last 4 digits', () => {
    const phone = '+966501234567';
    const masked = maskSensitiveString(phone);
    expect(masked).toContain('4567');
    expect(masked).toContain('****');
    expect(masked).not.toBe(phone);
  });

  it('leaves empty or short strings intact', () => {
    expect(maskSensitiveString('')).toBe('');
    expect(maskSensitiveString('123')).toBe('123');
  });

  it('contains critical security paths in SENSITIVE_REDACTION_PATHS', () => {
    const paths = new Set(SENSITIVE_REDACTION_PATHS);
    expect(paths.has('headers.authorization')).toBe(true);
    expect(paths.has('token')).toBe(true);
    expect(paths.has('password')).toBe(true);
    expect(paths.has('apiKey')).toBe(true);
    expect(paths.has('initData')).toBe(true);
    expect(paths.has('botToken')).toBe(true);
  });
});
