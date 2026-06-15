import { describe, expect, it, vi } from 'vitest';
import type { IAuditLogger } from '@tempot/database';
import type { ManagedBot } from '../../types/bot.types.js';
import { ModuleBaseRepository } from '../../repositories/module-base.repository.js';

class SoftDeleteRepository extends ModuleBaseRepository<ManagedBot> {
  protected moduleName = 'bot-management';
  protected entityName = 'managedBot';
  protected override hasSoftDelete = true;

  constructor(
    auditLogger: IAuditLogger,
    db: ConstructorParameters<typeof ModuleBaseRepository<ManagedBot>>[1],
  ) {
    super(auditLogger, db);
  }

  protected get model() {
    return (this.db as unknown as Record<string, object>)['managedBot'];
  }

  findActive(query?: Record<string, unknown>) {
    return this.findMany(query);
  }
}

describe('bot-management soft-delete repository scope', () => {
  it('prevents flat filters from overriding the active-record scope', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const repository = new SoftDeleteRepository({ log: vi.fn().mockResolvedValue(undefined) }, {
      managedBot: { findMany },
    } as unknown as ConstructorParameters<typeof ModuleBaseRepository<ManagedBot>>[1]);

    const result = await repository.findActive({
      telegramUsername: 'example_bot',
      isDeleted: true,
    });

    expect(result.isOk()).toBe(true);
    expect(findMany).toHaveBeenCalledWith({
      where: { telegramUsername: 'example_bot', isDeleted: false },
    });
  });
});
