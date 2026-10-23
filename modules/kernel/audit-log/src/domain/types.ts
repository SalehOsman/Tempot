export type ActorType = 'user' | 'admin' | 'system' | 'cron';

export type AuditStatus = 'SUCCESS' | 'FAILURE' | 'REJECTED';

export interface CreateAuditEventInput {
  readonly tenantId: string;
  readonly traceId?: string;
  readonly actorId: string;
  readonly actorType: ActorType;
  readonly action: string;
  readonly entityType: string;
  readonly entityId?: string;
  readonly status?: AuditStatus;
  readonly payload?: Record<string, unknown>;
  readonly metadata?: Record<string, unknown>;
  readonly errorDetails?: Record<string, unknown>;
}

export interface CaptureErrorInput {
  readonly tenantId: string;
  readonly traceId?: string;
  readonly actorId?: string;
  readonly actorType?: ActorType;
  readonly action: string;
  readonly entityType?: string;
  readonly entityId?: string;
  readonly error: unknown;
  readonly metadata?: Record<string, unknown>;
}

export interface AuditIntegrityReport {
  readonly isValid: boolean;
  readonly totalRecordsChecked: number;
  readonly lastHash: string;
  readonly corruptedRecordId?: string;
  readonly reason?: string;
}
