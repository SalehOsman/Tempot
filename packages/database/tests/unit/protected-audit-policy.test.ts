import { describe, expect, it, vi } from 'vitest';
import { BaseRepository } from '../../src/base/base.repository.js';
import { buildProtectedAuditChanges, buildSafeAuditSnapshot } from '../../src/base/audit.policy.js';

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
  it('keeps only allowlisted operational fields in audit snapshots', () => {
    const snapshot = buildSafeAuditSnapshot({
      language: 'en',
      role: 'USER',
      username: 'personal-username',
      gender: 'FEMALE',
      governorate: 'Cairo',
      countryCode: 'EG',
      unexpectedProfileField: 'unexpected-audit-canary',
      nested: {
        unexpectedKey: 'nested-audit-canary',
      },
    });

    expect(snapshot).toEqual({
      language: 'en',
      role: 'USER',
    });
    expect(JSON.stringify(snapshot)).not.toContain('personal-username');
    expect(JSON.stringify(snapshot)).not.toContain('unexpected-audit-canary');
    expect(JSON.stringify(snapshot)).not.toContain('nested-audit-canary');
  });

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

  it('does not report unchanged protected fields during an unrelated update', () => {
    const protectedEmail = {
      formatVersion: 1,
      algorithm: 'aes-256-gcm',
      keyVersion: 'enc-v1',
      nonce: 'nonce',
      ciphertext: 'ciphertext',
      authTag: 'auth-tag',
    };

    const changes = buildProtectedAuditChanges(
      { email: null, emailProtected: protectedEmail, role: 'USER' },
      { email: null, emailProtected: protectedEmail, role: 'ADMIN' },
    );

    expect(changes).toEqual([]);
  });
});
