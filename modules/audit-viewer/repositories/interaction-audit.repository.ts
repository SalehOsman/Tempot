import { err, ok, type Result } from 'neverthrow';
import { AppError } from '@tempot/shared';

export interface InteractionProblem {
  action: string;
  module: string;
  traceId?: string;
  status: string;
  timestamp: string;
  callbackData?: string;
  callbackNamespace?: string;
  referenceCode?: string;
  errorCode?: string;
}

interface AuditLogRecord {
  action: string;
  module: string;
  targetId?: string | null;
  status: string;
  timestamp: Date;
  after?: unknown;
}

export interface AuditLogReader {
  findMany: (args: Record<string, unknown>) => Promise<AuditLogRecord[]>;
}

interface RepositoryDeps {
  auditLog: AuditLogReader;
}

const BOT_INTERACTION_MODULES = [
  'bot-server',
  'settings-management',
  'notification-center',
  'content-management',
  'audit-viewer',
  'help-center',
  'user-management',
  'bot-management',
  'template-management',
  'input-engine',
];

export class InteractionAuditRepository {
  constructor(private readonly deps: RepositoryDeps) {}

  async findRecentProblems(limit: number): Promise<Result<InteractionProblem[], AppError>> {
    try {
      const records = await this.deps.auditLog.findMany({
        where: {
          status: 'FAILURE',
          module: { in: BOT_INTERACTION_MODULES },
        },
        orderBy: { timestamp: 'desc' },
        take: limit,
      });
      return ok(deduplicate(records.map(toInteractionProblem)));
    } catch (error: unknown) {
      return err(new AppError('audit-viewer.interaction_problem_query_failed', { error }));
    }
  }
}

function deduplicate(problems: InteractionProblem[]): InteractionProblem[] {
  const seen = new Set<string>();
  return problems.filter((problem) => {
    const key = problem.traceId ?? `${problem.module}:${problem.action}:${problem.timestamp}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function toInteractionProblem(record: AuditLogRecord): InteractionProblem {
  const metadata = readMetadata(record.after);
  return {
    action: record.action,
    module: record.module,
    traceId: record.targetId ?? undefined,
    status: record.status,
    timestamp: record.timestamp.toISOString(),
    callbackData: metadata.callbackData,
    callbackNamespace: metadata.callbackNamespace,
    referenceCode: metadata.referenceCode,
    errorCode: metadata.errorCode,
  };
}

function readMetadata(value: unknown): Partial<InteractionProblem> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return {};
  const record = value as Record<string, unknown>;
  return {
    callbackData: stringValue(record['callbackData']),
    callbackNamespace: stringValue(record['callbackNamespace']),
    referenceCode: stringValue(record['referenceCode']),
    errorCode: stringValue(record['errorCode']),
  };
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}
