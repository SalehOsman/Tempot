import { describe, expect, it, vi } from 'vitest';
import type { IAuditLogger } from '@tempot/database';
import type { Template } from '../../types/template.types.js';
import { ModuleBaseRepository } from '../../repositories/module-base.repository.js';

class SoftDeleteRepository extends ModuleBaseRepository<Template> {
  protected moduleName = 'template-management';
  protected entityName = 'template';
  protected override hasSoftDelete = true;

  constructor(
    auditLogger: IAuditLogger,
    db: ConstructorParameters<typeof ModuleBaseRepository<Template>>[1],
  ) {
    super(auditLogger, db);
  }

  protected get model() {
    return (this.db as unknown as Record<string, object>)['template'];
  }

  findActive(query?: Record<string, unknown>) {
    return this.findMany(query);
  }
}

describe('template-management soft-delete repository scope', () => {
  it('prevents nested filters from overriding the active-record scope', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const repository = new SoftDeleteRepository({ log: vi.fn().mockResolvedValue(undefined) }, {
      template: { findMany },
    } as unknown as ConstructorParameters<typeof ModuleBaseRepository<Template>>[1]);

    const result = await repository.findActive({
      where: { status: 'PUBLISHED', isDeleted: true },
      take: 10,
    });

    expect(result.isOk()).toBe(true);
    expect(findMany).toHaveBeenCalledWith({
      where: { status: 'PUBLISHED', isDeleted: false },
      take: 10,
    });
  });

  it('requires explicit authorization before reading deleted records', async () => {
    const findUnique = vi.fn().mockResolvedValue({ id: 'template-1' });
    const auditLogger = { log: vi.fn().mockResolvedValue(undefined) };
    const repository = new SoftDeleteRepository(auditLogger, {
      template: { findUnique, findMany: vi.fn() },
    } as unknown as ConstructorParameters<typeof ModuleBaseRepository<Template>>[1]);

    const denied = await repository.findDeletedById('template-1', {
      actorId: 'admin-1',
      actorRole: 'ADMIN',
      authorized: false,
      reason: 'operator-review',
    });

    expect(denied.isErr()).toBe(true);
    expect(findUnique).not.toHaveBeenCalled();

    const allowed = await repository.findDeletedById('template-1', {
      actorId: 'admin-1',
      actorRole: 'ADMIN',
      authorized: true,
      reason: 'operator-review',
    });

    expect(allowed.isOk()).toBe(true);
    expect(findUnique).toHaveBeenCalledWith({
      where: { id: 'template-1', isDeleted: true },
    });
    expect(auditLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'template-management.template.recovery_read',
        targetId: 'template-1',
      }),
    );
  });
});
