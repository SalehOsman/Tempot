import { describe, expect, it, vi } from 'vitest';
import { AccessService } from '../src/application/access-service.js';
import type { OperatorRecord, OperatorSessionRecord } from '../src/db/schema.js';

describe('AccessService & Capability Engine', () => {
  describe('Password Hashing & Verification', () => {
    it('hashes passwords securely and verifies them correctly', () => {
      const password = 'SuperSecretPassword123!';
      const hash = AccessService.hashPassword(password);

      expect(hash).toContain(':');
      expect(AccessService.verifyPassword(password, hash)).toBe(true);
      expect(AccessService.verifyPassword('WrongPassword', hash)).toBe(false);
    });
  });

  describe('Capability Engine (Zero-Role Engine)', () => {
    it('grants all permissions for universal wildcard (*)', () => {
      const caps = ['*'];
      expect(AccessService.can(caps, 'settings:read')).toBe(true);
      expect(AccessService.can(caps, 'settings:write')).toBe(true);
      expect(AccessService.can(caps, 'audit:read')).toBe(true);
      expect(AccessService.can(caps, 'finance:transfer')).toBe(true);
    });

    it('grants scoped permissions for namespace wildcard (e.g. settings:*)', () => {
      const caps = ['settings:*', 'broadcast:publish'];
      expect(AccessService.can(caps, 'settings:read')).toBe(true);
      expect(AccessService.can(caps, 'settings:write')).toBe(true);
      expect(AccessService.can(caps, 'broadcast:publish')).toBe(true);
      expect(AccessService.can(caps, 'audit:read')).toBe(false);
      expect(AccessService.can(caps, 'tasks:manage')).toBe(false);
    });

    it('grants only exact match when atomic capability is assigned', () => {
      const caps = ['settings:read'];
      expect(AccessService.can(caps, 'settings:read')).toBe(true);
      expect(AccessService.can(caps, 'settings:write')).toBe(false);
    });
  });

  describe('Session Lifecycle and Operator Authentication', () => {
    const tenantId = '00000000-0000-0000-0000-000000000001';
    const operatorId = '11111111-1111-1111-1111-111111111111';
    const rawPassword = 'ValidPassword123!';
    const passwordHash = AccessService.hashPassword(rawPassword);

    const mockOperator: OperatorRecord = {
      id: operatorId,
      tenantId,
      email: 'admin@tembot.io',
      passwordHash,
      displayName: 'System Admin',
      roleSlug: 'SuperAdmin',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    it('authenticates valid operator and establishes session', async () => {
      const insertedSessions: Array<{ sessionTokenHash: string; expiresAt: Date }> = [];

      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockOperator]),
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockImplementation((val) => {
            insertedSessions.push(val);
            return Promise.resolve();
          }),
        }),
      };

      const service = new AccessService(mockDb as never);
      const result = await service.login({
        tenantId,
        email: 'admin@tembot.io',
        password: rawPassword,
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.sessionToken).toBeDefined();
        expect(result.value.actor.id).toBe(operatorId);
        expect(result.value.actor.capabilities).toEqual(['*']);
      }
      expect(insertedSessions.length).toBe(1);
    });

    it('rejects deactivated operator account', async () => {
      const inactiveOperator: OperatorRecord = {
        ...mockOperator,
        isActive: false,
      };

      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([inactiveOperator]),
            }),
          }),
        }),
      };

      const service = new AccessService(mockDb as never);
      const result = await service.login({
        tenantId,
        email: 'admin@tembot.io',
        password: rawPassword,
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe('OPERATOR_INACTIVE');
      }
    });

    it('rejects invalid password', async () => {
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockOperator]),
            }),
          }),
        }),
      };

      const service = new AccessService(mockDb as never);
      const result = await service.login({
        tenantId,
        email: 'admin@tembot.io',
        password: 'IncorrectPassword!',
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe('INVALID_CREDENTIALS');
      }
    });
  });
});
