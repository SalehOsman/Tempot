import { Worker, Job } from 'bullmq';
import { SessionRepository } from './repository';
import { Session } from './types';
import { prisma } from '@tempot/database';

export const SESSION_SYNC_QUEUE = 'session-sync';

// Setup mock audit logger for worker
const dummyAuditLogger = {
  log: async () => {},
};

export const createSessionWorker = () => {
  const repository = new SessionRepository(dummyAuditLogger, prisma);

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
      } catch (err) {
        console.error('Failed to sync session to Postgres:', err);
        throw err; // BullMQ handles retries
      }
    },
    { connection },
  );
};
