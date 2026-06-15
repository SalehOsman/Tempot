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
});
