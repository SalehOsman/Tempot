import { AppError } from '@tempot/shared';

export class UnauthorizedError extends AppError {
  constructor(details?: unknown) {
    super('auth.unauthorized', details);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

export class ForbiddenError extends AppError {
  constructor(details?: unknown) {
    super('auth.forbidden', details);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}
