import { describe, it, expect, vi } from 'vitest';
import { BaseRepository } from '../../src/base/base.repository';

/* eslint-disable @typescript-eslint/no-explicit-any */
class TestRepository extends BaseRepository<any> {
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
    const repo = new TestRepository(auditLogger as any);

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
/* eslint-enable @typescript-eslint/no-explicit-any */
