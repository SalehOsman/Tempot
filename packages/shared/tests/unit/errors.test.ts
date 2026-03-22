import { describe, it, expect } from 'vitest';
import { AppError } from '../../src/errors';
import { Result, AsyncResult } from '../../src/result';
import { ok, err } from 'neverthrow';

describe('AppError', () => {
  it('should create an instance with code and details', () => {
    const error = new AppError('AUTH_UNAUTHORIZED', { userId: '123' });
    expect(error.code).toBe('AUTH_UNAUTHORIZED');
    expect(error.details).toEqual({ userId: '123' });
    expect(error.message).toBe('AUTH_UNAUTHORIZED');
  });

  it('should generate i18nKey from code', () => {
    const error = new AppError('AUTH_UNAUTHORIZED');
    // Assuming format errors.{code}
    expect(error.i18nKey).toBe('errors.AUTH_UNAUTHORIZED');
  });

  it('should allow optional loggedAt', () => {
    const error = new AppError('ERROR');
    expect(error.loggedAt).toBeUndefined();

    const now = new Date();
    error.loggedAt = now;
    expect(error.loggedAt).toBe(now);
  });
});

describe('Result types', () => {
  it('should be compatible with neverthrow ok', () => {
    const res: Result<string> = ok('success');
    expect(res.isOk()).toBe(true);
    if (res.isOk()) {
      expect(res.value).toBe('success');
    }
  });

  it('should be compatible with neverthrow err and AppError', () => {
    const appError = new AppError('FAILED');
    const res: Result<string> = err(appError);
    expect(res.isErr()).toBe(true);
    if (res.isErr()) {
      expect(res.error).toBeInstanceOf(AppError);
      expect(res.error.code).toBe('FAILED');
    }
  });

  it('should support AsyncResult', async () => {
    const res: AsyncResult<string> = Promise.resolve(ok('success'));
    const resolved = await res;
    expect(resolved.isOk()).toBe(true);
  });
});
