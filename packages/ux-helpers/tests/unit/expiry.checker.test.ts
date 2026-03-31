import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isExpired, checkExpiry } from '../../src/middleware/expiry.checker.js';
import { UX_ERRORS } from '../../src/ux.errors.js';

describe('isExpired', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return false when current time is before expiry', () => {
    // Set current time to 1000 seconds since epoch
    vi.setSystemTime(new Date(1000 * 1000));
    // Expiry at 2000 seconds — still 1000 seconds in the future
    const data = 'action:confirm:2000';
    const result = isExpired(data);
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toBe(false);
  });

  it('should return true when current time is past expiry', () => {
    // Set current time to 3000 seconds since epoch
    vi.setSystemTime(new Date(3000 * 1000));
    // Expiry was at 2000 seconds — already 1000 seconds expired
    const data = 'action:confirm:2000';
    const result = isExpired(data);
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toBe(true);
  });

  it('should return true when current time is exactly at expiry', () => {
    // Set current time to exactly 2000 seconds since epoch
    vi.setSystemTime(new Date(2000 * 1000));
    // Expiry at 2000 seconds — boundary case
    const data = 'action:confirm:2000';
    const result = isExpired(data);
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toBe(true);
  });

  it('should propagate decode error for malformed data', () => {
    const data = 'action:confirm:notanumber';
    const result = isExpired(data);
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe(UX_ERRORS.CALLBACK_DECODE_FAILED);
  });

  it('should propagate error for empty string', () => {
    const result = isExpired('');
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe(UX_ERRORS.CALLBACK_EMPTY);
  });
});

describe('checkExpiry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return ok when confirmation is not expired', () => {
    // Set current time to 1000 seconds since epoch
    vi.setSystemTime(new Date(1000 * 1000));
    // Expiry at 2000 — still valid
    const data = 'action:confirm:2000';
    const result = checkExpiry(data);
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toBeUndefined();
  });

  it('should return err with CONFIRMATION_EXPIRED when expired', () => {
    // Set current time to 3000 seconds since epoch
    vi.setSystemTime(new Date(3000 * 1000));
    // Expiry was at 2000
    const data = 'action:confirm:2000';
    const result = checkExpiry(data);
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe(UX_ERRORS.CONFIRMATION_EXPIRED);
  });

  it('should propagate decode errors for malformed data', () => {
    const data = 'singlepart';
    const result = checkExpiry(data);
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe(UX_ERRORS.CALLBACK_DECODE_FAILED);
  });
});
