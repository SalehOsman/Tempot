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
    create: vi
      .fn()
      .mockImplementation((args: { data: Record<string, unknown> }) =>
        Promise.resolve({ id: 'new-id', ...args.data }),
      ),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  protected moduleName = 'test';
  protected entityName = 'item';

  // Return type matches PrismaModelDelegate structurally via duck typing
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

  it('should return list of entities via findMany', async () => {
    const auditLogger = { log: vi.fn().mockResolvedValue(undefined) };
    const repo = new TestRepository(auditLogger);
    const items: TestEntity[] = [
      { id: '1', name: 'item-1' },
      { id: '2', name: 'item-2' },
    ];
    repo.mockModel.findMany.mockResolvedValue(items);

    const result = await repo.findMany();

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual(items);
    expect(repo.mockModel.findMany).toHaveBeenCalledWith({
      where: { isDeleted: false },
    });
  });

  it('should pass additional where clauses to findMany', async () => {
    const auditLogger = { log: vi.fn().mockResolvedValue(undefined) };
    const repo = new TestRepository(auditLogger);
    repo.mockModel.findMany.mockResolvedValue([]);

    const result = await repo.findMany({ name: 'test' });

    expect(result.isOk()).toBe(true);
    expect(repo.mockModel.findMany).toHaveBeenCalledWith({
      where: { isDeleted: false, name: 'test' },
    });
  });

  it('should return err on findMany failure', async () => {
    const auditLogger = { log: vi.fn().mockResolvedValue(undefined) };
    const repo = new TestRepository(auditLogger);
    repo.mockModel.findMany.mockRejectedValue(new Error('DB error'));

    const result = await repo.findMany();

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().message).toBe('test.find_many_failed');
  });
});
