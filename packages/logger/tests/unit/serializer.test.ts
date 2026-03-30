import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { appErrorSerializer } from '../../src/technical/serializer.js';
import { AppError } from '@tempot/shared';

describe('appErrorSerializer', () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('redacts sensitive keys in details recursively', () => {
    const error = new AppError('AUTH_FAILED', {
      password: 'mypassword',
      nested: {
        token: 'secret-token',
        safe: 'keep-me',
      },
    });

    const result = appErrorSerializer(error);

    expect(result.details.password).toBe('[REDACTED]');
    expect(result.details.nested.token).toBe('[REDACTED]');
    expect(result.details.nested.safe).toBe('keep-me');
  });

  it('formats code and i18nKey correctly', () => {
    const error = new AppError('USER_NOT_FOUND');
    const result = appErrorSerializer(error);

    expect(result.code).toBe('USER_NOT_FOUND');
    expect(result.i18nKey).toBe('errors.USER_NOT_FOUND');
  });

  it('respects Rule XXIII: does not re-serialize if already loggedAt', () => {
    const error = new AppError('ALREADY_LOGGED');
    error.loggedAt = new Date();

    const result = appErrorSerializer(error);

    // If already logged, it should probably return a minimal object or mark it as redundant
    // Based on Rule XXIII (No double logging), the serializer should probably
    // indicate it's already logged or return a special flag.
    // Let's assume it returns a special field or a simplified object.
    expect(result.__redundant).toBe(true);
  });

  it('suppresses stack traces when NODE_ENV is production', () => {
    process.env.NODE_ENV = 'production';
    const error = new AppError('PROD_ERROR');
    const result = appErrorSerializer(error);

    expect(result.stack).toBeUndefined();
  });

  it('includes stack traces when NODE_ENV is development', () => {
    process.env.NODE_ENV = 'development';
    const error = new AppError('DEV_ERROR');
    const result = appErrorSerializer(error);

    expect(result.stack).toBeDefined();
  });
});
