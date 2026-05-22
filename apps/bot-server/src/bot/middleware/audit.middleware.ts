import type { Context, NextFunction } from 'grammy';
import {
  extractCallbackNamespace,
  extractCommand,
  resolveInteractionModule,
} from '../interaction-routing.js';
import { getInteractionTrace, toInteractionTraceLog } from '../interaction-trace.js';

export interface AuditEntry {
  action: string;
  module: string;
  userId?: string;
  userRole?: string;
  targetId?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  status?: string;
}

export interface AuditDeps {
  auditLog: (entry: AuditEntry) => Promise<void>;
  commandModuleMap?: Record<string, string>;
  logger?: { warn: (data: object) => void };
}

interface SessionUserLike {
  role?: string;
}

function extractAction(ctx: Context): string {
  const trace = getInteractionTrace(ctx);
  if (trace?.callbackData) return trace.callbackData;
  if (ctx.callbackQuery?.data) return ctx.callbackQuery.data;
  const command = extractCommand(ctx.message?.text);
  if (command) return command;
  return 'message';
}

function resolveModule(
  ctx: Context,
  action: string,
  commandModuleMap: Record<string, string> | undefined,
): string {
  const trace = getInteractionTrace(ctx);
  if (trace) return trace.module;
  const namespace = extractCallbackNamespace(ctx.callbackQuery?.data);
  const command = action.startsWith('/') ? action : undefined;
  return resolveInteractionModule(command, namespace, commandModuleMap);
}

function buildAuditMetadata(ctx: Context, startedAt: number): Record<string, unknown> | undefined {
  const trace = getInteractionTrace(ctx);
  if (!trace) return undefined;
  return {
    ...toInteractionTraceLog(trace),
    durationMs: Date.now() - startedAt,
  };
}

async function writeAudit(deps: AuditDeps, entry: AuditEntry, errorStatus: string): Promise<void> {
  try {
    await deps.auditLog(entry);
  } catch (error: unknown) {
    deps.logger?.warn({
      code: 'bot-server.audit_log_failed',
      action: entry.action,
      module: entry.module,
      targetId: entry.targetId,
      status: errorStatus,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export function createAuditMiddleware(
  deps: AuditDeps,
): (ctx: Context, next: NextFunction) => Promise<void> {
  return async (ctx: Context, next: NextFunction): Promise<void> => {
    const action = extractAction(ctx);
    const trace = getInteractionTrace(ctx);
    const startedAt = trace?.startedAt ?? Date.now();
    const userId = ctx.from?.id?.toString();
    const ctxRecord = ctx as unknown as Record<string, unknown>;
    const sessionUser = ctxRecord['sessionUser'] as SessionUserLike | undefined;
    const userRole = sessionUser?.role;
    const module = resolveModule(ctx, action, deps.commandModuleMap);

    try {
      await next();
      await writeAudit(
        deps,
        {
          action,
          module,
          userId,
          userRole,
          targetId: trace?.traceId,
          after: buildAuditMetadata(ctx, startedAt),
          status: 'SUCCESS',
        },
        'SUCCESS',
      );
    } catch (error: unknown) {
      await writeAudit(
        deps,
        {
          action,
          module,
          userId,
          userRole,
          targetId: trace?.traceId,
          after: buildAuditMetadata(ctx, startedAt),
          status: 'FAILURE',
        },
        'FAILURE',
      );
      throw error;
    }
  };
}
