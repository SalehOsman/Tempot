import { describe, it, expect, vi } from 'vitest';
import { BaseRepository } from '../../src/base/base.repository';

interface TestEntity {
  id: string;
  name?: string;
  createdBy?: string;
  updatedBy?: string;
}

class TestRepository extends BaseRepository<TestEntity> {
  private _mockModel = {
    create: vi.fn().mockImplementation((args) => Promise.resolve({ id: 'new-id', ...args.data })),
    findUnique: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
  };

  protected moduleName = 'test';
  protected entityName = 'item';

  protected get model() {
    return this._mockModel;
  }

  get mockModel() {
    return this._mockModel;
  }
}

describe('BaseRepository', () => {
  it('should trigger AuditLogger on create', async () => {
    const auditLogger = { log: vi.fn().mockResolvedValue(undefined) };
    const repo = new TestRepository(auditLogger);

    const data = { name: 'test item' };
    const result = await repo.create(data);

    expect(result.isOk()).toBe(true);
    expect(auditLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'test.item.create',
        module: 'test',
        status: 'SUCCESS',
      }),
    );
  });
});
