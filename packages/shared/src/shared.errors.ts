/**
 * Base error class for all application errors
 * Rules: XXII (Hierarchical codes), XXIII (No double logging)
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly details?: unknown;
  public readonly i18nKey: string;
  public loggedAt?: Date;

  constructor(code: string, details?: unknown) {
    super(code);
    this.code = code;
    this.details = details;
    this.i18nKey = `errors.${code}`;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
