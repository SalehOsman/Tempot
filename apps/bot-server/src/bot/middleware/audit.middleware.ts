import type { Context, NextFunction } from 'grammy';

export interface AuditEntry {
  action: string;
  module: string;
  userId?: string;
  userRole?: string;
  status?: string;
}

export interface AuditDeps {
  auditLog: (entry: AuditEntry) => Promise<void>;
}

function extractAction(ctx: Context): string {
  const text = ctx.message?.text;
  if (text?.startsWith('/')) {
    return text.split(' ')[0];
  }
  return 'message';
}

interface SessionUserLike {
  role?: string;
}

/**
 * Creates audit middleware that logs every request result.
 * Runs AFTER handlers (wraps next()) and logs success/failure.
 * Audit failures are swallowed — they must never propagate to the user.
 */
export function createAuditMiddleware(
  deps: AuditDeps,
): (ctx: Context, next: NextFunction) => Promise<void> {
  return async (ctx: Context, next: NextFunction): Promise<void> => {
    const action = extractAction(ctx);
    const userId = ctx.from?.id?.toString();
    const ctxRecord = ctx as unknown as Record<string, unknown>;
    const sessionUser = ctxRecord['sessionUser'] as SessionUserLike | undefined;
    const userRole = sessionUser?.role;

    try {
      await next();
      try {
        await deps.auditLog({
          action,
          module: 'bot-server',
          userId,
          userRole,
          status: 'SUCCESS',
        });
      } catch {
        // Best-effort — audit failure must not propagate
      }
    } catch (error: unknown) {
      try {
        await deps.auditLog({
          action,
          module: 'bot-server',
          userId,
          userRole,
          status: 'FAILURE',
        });
      } catch {
        // Best-effort
      }
      throw error;
    }
  };
}
