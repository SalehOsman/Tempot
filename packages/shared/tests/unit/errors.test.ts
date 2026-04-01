import { describe, it, expect } from 'vitest';
import { AppError } from '../../src/shared.errors';
import { Result, AsyncResult } from '../../src/shared.result';
import { ok, err } from 'neverthrow';

describe('AppError', () => {
  it('should create an instance with code and details', () => {
    const error = new AppError('auth.unauthorized', { userId: '123' });
    expect(error.code).toBe('auth.unauthorized');
    expect(error.details).toEqual({ userId: '123' });
    expect(error.message).toBe('auth.unauthorized');
  });

  it('should generate i18nKey from code', () => {
    const error = new AppError('auth.unauthorized');
    // Assuming format errors.{code}
    expect(error.i18nKey).toBe('errors.auth.unauthorized');
  });

  it('should allow optional loggedAt', () => {
    const error = new AppError('shared.error');
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
    const appError = new AppError('shared.failed');
    const res: Result<string> = err(appError);
    expect(res.isErr()).toBe(true);
    if (res.isErr()) {
      expect(res.error).toBeInstanceOf(AppError);
      expect(res.error.code).toBe('shared.failed');
    }
  });

  it('should support AsyncResult', async () => {
    const res: AsyncResult<string> = Promise.resolve(ok('success'));
    const resolved = await res;
    expect(resolved.isOk()).toBe(true);
  });
});
