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

  findActive(where?: Record<string, unknown>) {
    return this.findMany(where);
  }
}

const recoveryAccess = {
  actorId: 'admin-1',
  actorRole: 'ADMIN',
  authorized: true,
  reason: 'operator-review',
};

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

    const result = await repo.findActive();

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

    const result = await repo.findActive({ name: 'test' });

    expect(result.isOk()).toBe(true);
    expect(repo.mockModel.findMany).toHaveBeenCalledWith({
      where: { isDeleted: false, name: 'test' },
    });
  });

  it('should prevent flat findMany filters from overriding the active-record scope', async () => {
    const auditLogger = { log: vi.fn().mockResolvedValue(undefined) };
    const repo = new TestRepository(auditLogger);
    repo.mockModel.findMany.mockResolvedValue([]);

    const result = await repo.findActive({ isDeleted: true, name: 'test' });

    expect(result.isOk()).toBe(true);
    expect(repo.mockModel.findMany).toHaveBeenCalledWith({
      where: { name: 'test', isDeleted: false },
    });
  });

  it('should pass Prisma findMany arguments without nesting them inside where', async () => {
    const auditLogger = { log: vi.fn().mockResolvedValue(undefined) };
    const repo = new TestRepository(auditLogger);
    repo.mockModel.findMany.mockResolvedValue([]);

    const result = await repo.findActive({
      where: { name: 'test' },
      skip: 10,
      take: 5,
      orderBy: { name: 'asc' },
    });

    expect(result.isOk()).toBe(true);
    expect(repo.mockModel.findMany).toHaveBeenCalledWith({
      where: { isDeleted: false, name: 'test' },
      skip: 10,
      take: 5,
      orderBy: { name: 'asc' },
    });
  });

  it('should prevent nested findMany filters from overriding the active-record scope', async () => {
    const auditLogger = { log: vi.fn().mockResolvedValue(undefined) };
    const repo = new TestRepository(auditLogger);
    repo.mockModel.findMany.mockResolvedValue([]);

    const result = await repo.findActive({
      where: { isDeleted: true, name: 'test' },
      take: 5,
    });

    expect(result.isOk()).toBe(true);
    expect(repo.mockModel.findMany).toHaveBeenCalledWith({
      where: { name: 'test', isDeleted: false },
      take: 5,
    });
  });

  it('should return err on findMany failure', async () => {
    const auditLogger = { log: vi.fn().mockResolvedValue(undefined) };
    const repo = new TestRepository(auditLogger);
    repo.mockModel.findMany.mockRejectedValue(new Error('DB error'));

    const result = await repo.findActive();

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().message).toBe('test.find_many_failed');
  });

  it('should deny deleted-record recovery without an explicit privileged grant', async () => {
    const auditLogger = { log: vi.fn().mockResolvedValue(undefined) };
    const repo = new TestRepository(auditLogger);

    const result = await repo.findDeletedById('deleted-1', {
      ...recoveryAccess,
      authorized: false,
    });

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().code).toBe('test.recovery_forbidden');
    expect(repo.mockModel.findUnique).not.toHaveBeenCalled();
    expect(auditLogger.log).not.toHaveBeenCalled();
  });

  it('should use an explicit deleted-record scope and audit privileged recovery reads', async () => {
    const auditLogger = { log: vi.fn().mockResolvedValue(undefined) };
    const repo = new TestRepository(auditLogger);
    repo.mockModel.findUnique.mockResolvedValue({ id: 'deleted-1', name: 'deleted item' });

    const result = await repo.findDeletedById('deleted-1', recoveryAccess);

    expect(result.isOk()).toBe(true);
    expect(repo.mockModel.findUnique).toHaveBeenCalledWith({
      where: { id: 'deleted-1', isDeleted: true },
    });
    expect(auditLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'test.item.recovery_read',
        module: 'test',
        targetId: 'deleted-1',
        status: 'SUCCESS',
      }),
    );
  });
});
