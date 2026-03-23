import { BaseRepository, prisma } from '@tempot/database';
import { Session } from '@prisma/client';

export class SessionRepository extends BaseRepository<Session> {
  protected moduleName = 'session-manager';
  protected entityName = 'session';

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  constructor(auditLogger: any, db = prisma) {
    super(auditLogger, db);
  }

  protected get model() {
    return this.db.session;
  }
}
