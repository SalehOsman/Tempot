import { describe, it, expect } from 'vitest';
import { UnauthorizedError, ForbiddenError } from '../../src/errors/auth.errors';

describe('Auth Errors', () => {
  it('should create UnauthorizedError with correct code', () => {
    const err = new UnauthorizedError();
    expect(err.code).toBe('UNAUTHORIZED');
    expect(err.i18nKey).toBe('errors.UNAUTHORIZED');
  });

  it('should create ForbiddenError with correct code', () => {
    const err = new ForbiddenError({ reason: 'testing' });
    expect(err.code).toBe('FORBIDDEN');
    expect(err.details).toEqual({ reason: 'testing' });
  });
});
