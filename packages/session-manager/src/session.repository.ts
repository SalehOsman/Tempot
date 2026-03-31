import { BaseRepository, prisma } from '@tempot/database';
import { Session } from '@prisma/client';

/** Minimal audit logger interface required by BaseRepository. */
export interface AuditLogger {
  log: (data: unknown) => Promise<void>;
}

export class SessionRepository extends BaseRepository<Session> {
  protected moduleName = 'session-manager';
  protected entityName = 'session';

  constructor(auditLogger: AuditLogger, db = prisma) {
    super(auditLogger, db);
  }

  protected get model() {
    return this.db.session;
  }
}
