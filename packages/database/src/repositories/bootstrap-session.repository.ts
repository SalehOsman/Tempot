import { AppError, type AsyncResult } from '@tempot/shared';
import { err, ok } from 'neverthrow';
import { prisma } from '../prisma/prisma.client.js';

export interface BootstrapSessionInput {
  sessionId: string;
  userId: string;
  chatId: string;
  role: string;
  status: string;
  language: string;
}

interface BootstrapSessionDelegate {
  upsert(args: {
    where: { id: string };
    update: { role: string };
    create: {
      id: string;
      userId: string;
      chatId: string;
      role: string;
      status: string;
      language: string;
    };
  }): Promise<unknown>;
}

interface BootstrapSessionDatabaseClient {
  session: BootstrapSessionDelegate;
}

export class BootstrapSessionRepository {
  constructor(private readonly db: BootstrapSessionDatabaseClient = prisma) {}

  async upsertSuperAdminSession(input: BootstrapSessionInput): AsyncResult<void> {
    try {
      await this.db.session.upsert({
        where: { id: input.sessionId },
        update: { role: input.role },
        create: {
          id: input.sessionId,
          userId: input.userId,
          chatId: input.chatId,
          role: input.role,
          status: input.status,
          language: input.language,
        },
      });
      return ok(undefined);
    } catch (error: unknown) {
      return err(new AppError('database.bootstrap_session_upsert_failed', { error }));
    }
  }
}
