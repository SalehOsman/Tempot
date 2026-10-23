import type { Result } from 'neverthrow';
import { DomainError } from '@tembot/shared-types';
import { createChildLogger } from '@tembot/logger';
import type { AuditService } from './audit-service.js';
import type { AuditLogRecord } from '../db/schema.js';
import type { CaptureErrorInput, AuditError } from '../domain/types.js';

const errorLogger = createChildLogger({ module: 'audit-log', slice: 'error-recorder' });

export class ErrorRecorder {
  constructor(private readonly auditService: AuditService) {}

  /**
   * Captures an error, sanitizes diagnostic details, logs a structured error,
   * and persists a forensic audit trail entry.
   */
  async captureError(
    input: CaptureErrorInput
  ): Promise<Result<AuditLogRecord, AuditError>> {
    const errorDetails = this.serializeError(input.error);

    errorLogger.error(
      {
        action: input.action,
        tenantId: input.tenantId,
        actorId: input.actorId,
        errorDetails,
      },
      `Forensic Error Captured: [${input.action}]`
    );

    return this.auditService.record({
      tenantId: input.tenantId,
      traceId: input.traceId,
      actorId: input.actorId ?? 'system:error-recorder',
      actorType: input.actorType ?? 'system',
      action: `error:${input.action}`,
      entityType: input.entityType ?? 'system_error',
      entityId: input.entityId,
      status: 'FAILURE',
      payload: { errorName: errorDetails.name, errorMessage: errorDetails.message },
      metadata: input.metadata ?? {},
      errorDetails,
    });
  }

  private serializeError(error: unknown): Record<string, unknown> {
    if (error instanceof DomainError) {
      return {
        name: error.name,
        code: error.code,
        message: error.message,
        httpStatus: error.httpStatus,
        details: error.details,
        stack: error.stack,
      };
    }

    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    return {
      name: 'UnknownError',
      message: String(error),
    };
  }
}
