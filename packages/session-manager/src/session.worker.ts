import { Worker, Job } from 'bullmq';
import { SessionRepository, AuditLogger } from './session.repository.js';
import { Session } from './session.types.js';
import { prisma } from '@tempot/database';
import type { ShutdownManager } from '@tempot/shared';

export const SESSION_SYNC_QUEUE = 'session-sync';

const DEFAULT_REDIS_HOST = 'localhost';
const DEFAULT_REDIS_PORT = 6379;

/** Logger interface accepted by createSessionWorker. */
export interface WorkerLogger {
  error: (data: object) => void;
}

/** Options for createSessionWorker. */
export interface SessionWorkerOptions {
  auditLogger?: AuditLogger;
  logger?: WorkerLogger;
  /** Redis connection options; injected rather than hardcoded. */
  connection?: {
    host: string;
    port: number;
    password?: string;
  };
  /** When provided, worker.close() is registered for graceful shutdown (Rule XVII). */
  shutdownManager?: ShutdownManager;
}

const noopAuditLogger: AuditLogger = { log: async () => {} };

/** Build a Prisma-compatible sync payload from session data */
function buildSyncPayload(sessionData: Session) {
  const id = `${sessionData.userId}:${sessionData.chatId}`;
  return {
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
}

export const createSessionWorker = (options: SessionWorkerOptions = {}) => {
  const auditLogger = options.auditLogger ?? noopAuditLogger;
  const logger = options.logger;
  const repository = new SessionRepository(auditLogger, prisma);

  const connection = options.connection ?? {
    host: process.env.REDIS_HOST || DEFAULT_REDIS_HOST,
    port: Number(process.env.REDIS_PORT) || DEFAULT_REDIS_PORT,
  };

  const worker = new Worker(
    SESSION_SYNC_QUEUE,
    async (job: Job<{ userId: string; chatId: string; sessionData: Session }>) => {
      const { sessionData } = job.data;
      const payload = buildSyncPayload(sessionData);
      const id = payload.id;

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
          code: 'session.system_degradation',
          payload: { target: 'SUPER_ADMIN', operation: 'session-sync', error: String(syncError) },
        });
        throw syncError; // BullMQ handles retries
      }
    },
    { connection },
  );

  if (options.shutdownManager) {
    options.shutdownManager.register(async () => {
      await worker.close();
    });
  }

  return worker;
};
