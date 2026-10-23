import { describe, it, expect } from 'vitest';
import {
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  RateLimitedError,
  InternalServerError,
} from '../src/errors.js';

describe('DomainError and ProblemDetails Specification', () => {
  it('correctly sets HTTP status codes and error codes for domain errors', () => {
    const valErr = new ValidationError('Invalid name');
    expect(valErr.httpStatus).toBe(400);
    expect(valErr.code).toBe('VALIDATION_ERROR');

    const notFound = new NotFoundError('User not found');
    expect(notFound.httpStatus).toBe(404);
    expect(notFound.code).toBe('NOT_FOUND');

    const unauth = new UnauthorizedError('Unauthorized access');
    expect(unauth.httpStatus).toBe(401);

    const forbidden = new ForbiddenError('Lacks permission');
    expect(forbidden.httpStatus).toBe(403);

    const conflict = new ConflictError('Resource exists');
    expect(conflict.httpStatus).toBe(409);

    const rate = new RateLimitedError('Too many requests');
    expect(rate.httpStatus).toBe(429);

    const internal = new InternalServerError('Server failed');
    expect(internal.httpStatus).toBe(500);
  });

  it('generates valid RFC 7807 ProblemDetails object', () => {
    const err = new ValidationError('Field is invalid', [
      { name: 'email', reason: 'Must be a valid email format' },
    ]);

    const problem = err.toProblemDetails('/api/v1/users');

    expect(problem.status).toBe(400);
    expect(problem.code).toBe('VALIDATION_ERROR');
    expect(problem.detail).toBe('Field is invalid');
    expect(problem.instance).toBe('/api/v1/users');
    expect(problem.type).toBe('https://tembot.dev/errors/validation-error');
    expect(problem.timestamp).toBeDefined();
  });
});
