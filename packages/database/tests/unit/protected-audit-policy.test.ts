import { describe, expect, it, vi } from 'vitest';
import { BaseRepository } from '../../src/base/base.repository.js';

interface ProtectedTestEntity {
  id: string;
  email?: string;
  language?: string;
}

class ProtectedTestRepository extends BaseRepository<ProtectedTestEntity> {
  protected moduleName = 'users';
  protected entityName = 'userProfile';

  protected get model() {
    return {
      create: vi.fn().mockResolvedValue({
        id: 'user-1',
        email: 'audit-canary@example.com',
        language: 'en',
      }),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
  }
}

describe('BaseRepository protected audit policy', () => {
  it('records safe change metadata without whole protected entities', async () => {
    const auditLogger = { log: vi.fn().mockResolvedValue(undefined) };
    const repository = new ProtectedTestRepository(auditLogger);

    const result = await repository.create({
      email: 'audit-canary@example.com',
      language: 'en',
    });

    expect(result.isOk()).toBe(true);
    const serializedAudit = JSON.stringify(auditLogger.log.mock.calls);
    expect(serializedAudit).not.toContain('audit-canary@example.com');
    expect(auditLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        changes: expect.arrayContaining([
          expect.objectContaining({
            fieldId: 'email',
            protected: true,
            changeKind: 'added',
          }),
        ]),
      }),
    );
  });
});
