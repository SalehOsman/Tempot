import { AppError } from '@tempot/shared';

export class UnauthorizedError extends AppError {
  constructor(details?: unknown) {
    super('UNAUTHORIZED', details);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

export class ForbiddenError extends AppError {
  constructor(details?: unknown) {
    super('FORBIDDEN', details);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}
