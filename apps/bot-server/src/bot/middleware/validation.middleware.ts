import type { Context, NextFunction } from 'grammy';

/**
 * Creates validation middleware — a pass-through slot per DC-9.
 * Validation schemas are registered per-command by modules;
 * this middleware exists to maintain the fixed middleware chain order.
 */
export function createValidationMiddleware(): (ctx: Context, next: NextFunction) => Promise<void> {
  return async (_ctx: Context, next: NextFunction): Promise<void> => {
    await next();
  };
}
