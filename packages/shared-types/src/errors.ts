export type StandardErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'BAD_GATEWAY';

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  code: string;
  timestamp: string;
  invalidParams?: readonly { name: string; reason: string }[];
}

export abstract class DomainError extends Error {
  public abstract readonly code: string;
  public abstract readonly httpStatus: number;

  constructor(
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  public toProblemDetails(instance?: string): ProblemDetails {
    return {
      type: `https://tembot.dev/errors/${this.code.toLowerCase().replace(/_/g, '-')}`,
      title: this.name,
      status: this.httpStatus,
      detail: this.message,
      instance,
      code: this.code,
      timestamp: new Date().toISOString(),
    };
  }
}

export class ValidationError extends DomainError {
  public readonly code = 'VALIDATION_ERROR';
  public readonly httpStatus = 400;
}

export class NotFoundError extends DomainError {
  public readonly code = 'NOT_FOUND';
  public readonly httpStatus = 404;
}

export class UnauthorizedError extends DomainError {
  public readonly code = 'UNAUTHORIZED';
  public readonly httpStatus = 401;
}

export class ForbiddenError extends DomainError {
  public readonly code = 'FORBIDDEN';
  public readonly httpStatus = 403;
}

export class ConflictError extends DomainError {
  public readonly code = 'CONFLICT';
  public readonly httpStatus = 409;
}

export class RateLimitedError extends DomainError {
  public readonly code = 'RATE_LIMITED';
  public readonly httpStatus = 429;
}

export class InternalServerError extends DomainError {
  public readonly code = 'INTERNAL_ERROR';
  public readonly httpStatus = 500;
}
