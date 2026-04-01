import { describe, it, expect } from 'vitest';
import { UnauthorizedError, ForbiddenError } from '../../src/errors/auth.errors.js';

describe('Auth Errors', () => {
  it('should create UnauthorizedError with correct code', () => {
    const err = new UnauthorizedError();
    expect(err.code).toBe('auth.unauthorized');
    expect(err.i18nKey).toBe('errors.auth.unauthorized');
  });

  it('should create ForbiddenError with correct code', () => {
    const err = new ForbiddenError({ reason: 'testing' });
    expect(err.code).toBe('auth.forbidden');
    expect(err.details).toEqual({ reason: 'testing' });
  });
});
