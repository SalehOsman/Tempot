/**
 * Base error class for all application errors
 * Rules: XXII (Hierarchical codes), XXIII (No double logging)
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly details?: unknown;
  public loggedAt?: Date;

  constructor(code: string, details?: unknown) {
    super(code);
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
