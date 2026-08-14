import { Langfuse } from 'langfuse';
import { ok, err } from 'neverthrow';
import type { AsyncResult } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import type { AILogger } from '../ai-core.contracts.js';
import { AI_ERRORS } from '../ai-core.errors.js';

/** Audit log entry for an AI interaction */
export interface AIAuditEntry {
  userId: string;
  action: 'generation' | 'embedding' | 'tool_call' | 'rag_search' | 'conversation_end';
  input?: string;
  output?: string;
  toolName?: string;
  tokenUsage?: { input: number; output: number; total: number };
  latencyMs: number;
  success: boolean;
  errorCode?: string;
  metadata?: Record<string, unknown>;
}

export class AuditService {
  private readonly langfuse: Langfuse;

  constructor(private readonly logger: AILogger) {
    this.langfuse = new Langfuse();
  }

  /** Log an AI interaction to Langfuse */
  async log(entry: AIAuditEntry): AsyncResult<void, AppError> {
    try {
      const trace = this.langfuse.trace({
        name: entry.action,
        userId: entry.userId,
        metadata: {
          success: entry.success,
          latencyMs: entry.latencyMs,
          ...(entry.metadata ?? {}),
        },
      });

      if (entry.action === 'generation' || entry.action === 'tool_call') {
        trace.generation({
          name: entry.toolName ?? entry.action,
          input: entry.input,
          output: entry.output,
          usage: entry.tokenUsage
            ? {
                input: entry.tokenUsage.input,
                output: entry.tokenUsage.output,
                total: entry.tokenUsage.total,
              }
            : undefined,
          metadata: {
            success: entry.success,
            errorCode: entry.errorCode,
          },
        });
      }

      return ok(undefined);
    } catch (error: unknown) {
      this.logger.warn({
        code: AI_ERRORS.AUDIT_LOG_FAILED,
        entry,
        error: String(error),
      });
      // Audit failure should not break the operation — fire-and-log
      return ok(undefined);
    }
  }

  /** Flush pending events to Langfuse */
  async flush(): AsyncResult<void, AppError> {
    try {
      await this.langfuse.flushAsync();
      return ok(undefined);
    } catch (error: unknown) {
      return err(new AppError(AI_ERRORS.AUDIT_LOG_FAILED, error));
    }
  }

  /** Shutdown Langfuse client */
  async shutdown(): AsyncResult<void, AppError> {
    try {
      await this.langfuse.shutdownAsync();
      return ok(undefined);
    } catch (error: unknown) {
      return err(new AppError(AI_ERRORS.AUDIT_LOG_FAILED, error));
    }
  }
}
