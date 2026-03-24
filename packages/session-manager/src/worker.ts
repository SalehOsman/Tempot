import { Worker, Job } from 'bullmq';
import { SessionRepository, AuditLogger } from './repository';
import { Session } from './types';
import { prisma } from '@tempot/database';

export const SESSION_SYNC_QUEUE = 'session-sync';

/** Logger interface accepted by createSessionWorker. */
export interface WorkerLogger {
  error: (data: object) => void;
}

/** Options for createSessionWorker. */
export interface SessionWorkerOptions {
  auditLogger?: AuditLogger;
  logger?: WorkerLogger;
}

const noopAuditLogger: AuditLogger = { log: async () => {} };

export const createSessionWorker = (options: SessionWorkerOptions = {}) => {
  const auditLogger = options.auditLogger ?? noopAuditLogger;
  const logger = options.logger;
  const repository = new SessionRepository(auditLogger, prisma);

  const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
  };

  return new Worker(
    SESSION_SYNC_QUEUE,
    async (job: Job<{ userId: string; chatId: string; sessionData: Session }>) => {
      const { sessionData } = job.data;

      const id = `${sessionData.userId}:${sessionData.chatId}`;

      // Convert arbitrary objects/nulls to Prisma acceptable format (Prisma.InputJsonValue).
      // JSON.parse(JSON.stringify) cleans out undefined values that Prisma JSONB rejects.
      const payload = {
        id,
        userId: sessionData.userId,
        chatId: sessionData.chatId,
        role: sessionData.role,
        status: sessionData.status,
        language: sessionData.language,
        activeConversation: sessionData.activeConversation,
        metadata: sessionData.metadata ? JSON.parse(JSON.stringify(sessionData.metadata)) : null,
        schemaVersion: sessionData.schemaVersion,
        version: sessionData.version,
      };

      try {
        const existing = await repository.findById(id);
        if (existing.isOk()) {
          // If existing is found and version is >= payload version, ignore to respect OCC
          if (existing.value.version >= payload.version) {
            return;
          }
          await repository.update(id, payload);
        } else {
          await repository.create(payload);
        }
      } catch (syncError) {
        logger?.error({
          code: 'SYSTEM_DEGRADATION',
          payload: { target: 'SUPER_ADMIN', operation: 'session-sync', error: String(syncError) },
        });
        throw syncError; // BullMQ handles retries
      }
    },
    { connection },
  );
};
