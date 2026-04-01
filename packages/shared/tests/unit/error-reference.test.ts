import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  generateErrorReference,
  isValidErrorReference,
} from '../../src/error-reference/error-reference.generator';

const ERROR_REFERENCE_PATTERN = /^ERR-\d{8}-[A-Z0-9]{4}$/;

describe('generateErrorReference', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return a string matching ERR-YYYYMMDD-XXXX format', () => {
    const ref = generateErrorReference();
    expect(ref).toMatch(ERROR_REFERENCE_PATTERN);
  });

  it('should embed the current date as YYYYMMDD', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-01T12:00:00Z'));

    const ref = generateErrorReference();
    expect(ref).toContain('ERR-20260401-');
  });

  it('should generate unique codes across 100 invocations', () => {
    const codes = new Set<string>();
    for (let i = 0; i < 100; i++) {
      codes.add(generateErrorReference());
    }
    expect(codes.size).toBe(100);
  });

  it('should produce a 4-character alphanumeric suffix', () => {
    const ref = generateErrorReference();
    const suffix = ref.split('-').pop();
    expect(suffix).toHaveLength(4);
    expect(suffix).toMatch(/^[A-Z0-9]{4}$/);
  });
});

describe('isValidErrorReference', () => {
  it('should return true for a valid reference code', () => {
    expect(isValidErrorReference('ERR-20260401-A1B2')).toBe(true);
  });

  it('should return true for a reference with all digits in suffix', () => {
    expect(isValidErrorReference('ERR-20250115-1234')).toBe(true);
  });

  it('should return true for a reference with all letters in suffix', () => {
    expect(isValidErrorReference('ERR-20250115-ABCD')).toBe(true);
  });

  it('should return false for lowercase suffix', () => {
    expect(isValidErrorReference('ERR-20260401-a1b2')).toBe(false);
  });

  it('should return false for missing ERR prefix', () => {
    expect(isValidErrorReference('REF-20260401-A1B2')).toBe(false);
  });

  it('should return false for wrong date length', () => {
    expect(isValidErrorReference('ERR-2026041-A1B2')).toBe(false);
  });

  it('should return false for wrong suffix length', () => {
    expect(isValidErrorReference('ERR-20260401-A1B')).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(isValidErrorReference('')).toBe(false);
  });

  it('should return false for arbitrary string', () => {
    expect(isValidErrorReference('not-an-error-ref')).toBe(false);
  });
});
