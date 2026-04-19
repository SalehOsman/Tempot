import { ok, err } from 'neverthrow';
import type { AsyncResult } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import { BOT_SERVER_ERRORS } from '../bot-server.errors.js';
import type { ModuleLogger } from '../bot-server.types.js';

export interface PrismaSessionUpsertArgs {
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
}

export interface BootstrapPrisma {
  session: {
    upsert: (args: PrismaSessionUpsertArgs) => Promise<unknown>;
  };
}

interface BootstrapDeps {
  prisma: BootstrapPrisma;
  logger: ModuleLogger;
}

export async function bootstrapSuperAdmins(ids: number[], deps: BootstrapDeps): AsyncResult<void> {
  const { prisma, logger } = deps;

  if (ids.length === 0) {
    logger.warn('No super admin IDs configured');
    return ok(undefined);
  }

  try {
    for (const id of ids) {
      const strId = String(id);
      const sessionId = `${strId}:${strId}`;
      await prisma.session.upsert({
        where: { id: sessionId },
        update: { role: 'SUPER_ADMIN' },
        create: {
          id: sessionId,
          userId: strId,
          chatId: strId,
          role: 'SUPER_ADMIN',
          status: 'ACTIVE',
          language: 'ar-EG',
        },
      });
      logger.info(`Bootstrapped super admin: ${strId}`);
    }
    return ok(undefined);
  } catch (error: unknown) {
    logger.error({ msg: 'Super admin bootstrap failed', error });
    return err(new AppError(BOT_SERVER_ERRORS.SUPER_ADMIN_BOOTSTRAP_FAILED, { error }));
  }
}
