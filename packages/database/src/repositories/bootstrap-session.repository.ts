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

interface BootstrapUserProfileDelegate {
  upsert(args: {
    where: { telegramId: bigint };
    update: { role: string; language: string };
    create: {
      telegramId: bigint;
      username: null;
      language: string;
      role: string;
    };
  }): Promise<unknown>;
}

interface BootstrapSessionDatabaseClient {
  session: BootstrapSessionDelegate;
  userProfile: BootstrapUserProfileDelegate;
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
      await this.db.userProfile.upsert({
        where: { telegramId: BigInt(input.userId) },
        update: { role: input.role, language: input.language },
        create: {
          telegramId: BigInt(input.userId),
          username: null,
          language: input.language,
          role: input.role,
        },
      });
      return ok(undefined);
    } catch (error: unknown) {
      return err(new AppError('database.bootstrap_session_upsert_failed', { error }));
    }
  }
}
