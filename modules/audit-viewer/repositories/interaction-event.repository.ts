import { err, ok, type Result } from 'neverthrow';
import { AppError } from '@tempot/shared';

export interface InteractionTimelineItem {
  traceId: string;
  sequence: number;
  module: string;
  action?: string;
  stage: string;
  status: string;
  reason?: string;
  viewKey?: string;
  referenceCode?: string;
  errorCode?: string;
  occurredAt: string;
}

interface InteractionEventRecord {
  traceId: string;
  sequence: number;
  module: string;
  action?: string | null;
  stage: string;
  status: string;
  reason?: string | null;
  viewKey?: string | null;
  referenceCode?: string | null;
  errorCode?: string | null;
  occurredAt?: Date;
  createdAt: Date;
}

export interface InteractionEventReader {
  findMany: (args: Record<string, unknown>) => Promise<InteractionEventRecord[]>;
}

interface RepositoryDeps {
  interactionEvents: InteractionEventReader;
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

export class InteractionEventRepository {
  constructor(private readonly deps: RepositoryDeps) {}

  async findRecentTimeline(limit: number): Promise<Result<InteractionTimelineItem[], AppError>> {
    try {
      const records = await this.deps.interactionEvents.findMany({
        where: {
          module: { in: BOT_INTERACTION_MODULES },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
      return ok(records.map(toTimelineItem));
    } catch (error: unknown) {
      return err(new AppError('audit-viewer.interaction_timeline_query_failed', { error }));
    }
  }

  async findRecentFailures(limit: number): Promise<Result<InteractionTimelineItem[], AppError>> {
    try {
      const records = await this.deps.interactionEvents.findMany({
        where: {
          module: { in: BOT_INTERACTION_MODULES },
          status: 'failed',
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
      return ok(records.map(toTimelineItem));
    } catch (error: unknown) {
      return err(new AppError('audit-viewer.interaction_failure_query_failed', { error }));
    }
  }
}

function toTimelineItem(record: InteractionEventRecord): InteractionTimelineItem {
  return {
    traceId: record.traceId,
    sequence: record.sequence,
    module: record.module,
    action: record.action ?? undefined,
    stage: record.stage,
    status: record.status,
    reason: record.reason ?? undefined,
    viewKey: record.viewKey ?? undefined,
    referenceCode: record.referenceCode ?? undefined,
    errorCode: record.errorCode ?? undefined,
    occurredAt: (record.occurredAt ?? record.createdAt).toISOString(),
  };
}
