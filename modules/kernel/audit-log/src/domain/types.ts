import { DomainError } from '@tembot/shared-types';

export type ActorType = 'user' | 'admin' | 'system' | 'cron';

export type AuditStatus = 'SUCCESS' | 'FAILURE' | 'REJECTED';

export class AuditError extends DomainError {
  public readonly code: string;
  public readonly httpStatus: number;

  constructor(
    code: string,
    message: string,
    httpStatus = 500,
    details?: unknown
  ) {
    super(message, details);
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

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
