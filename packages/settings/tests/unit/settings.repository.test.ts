import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SettingsRepository } from '../../src/settings.repository.js';
import { SETTINGS_ERRORS } from '../../src/settings.errors.js';
import type { SettingsPrismaClient } from '../../src/settings.repository.js';

function createMockPrismaClient(): SettingsPrismaClient {
  return {
    setting: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
    },
  };
}

describe('SettingsRepository', () => {
  let mockPrisma: SettingsPrismaClient;
  let repo: SettingsRepository;

  const mockRecord = {
    key: 'join_mode',
    value: '"AUTO"',
    description: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: null,
    updatedBy: null,
  };

  beforeEach(() => {
    mockPrisma = createMockPrismaClient();
    repo = new SettingsRepository(mockPrisma);
  });

  describe('findByKey', () => {
    it('should return the setting when found', async () => {
      vi.mocked(mockPrisma.setting.findUnique).mockResolvedValue(mockRecord);

      const result = await repo.findByKey('join_mode');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(mockRecord);
      }
      expect(mockPrisma.setting.findUnique).toHaveBeenCalledWith({ where: { key: 'join_mode' } });
    });

    it('should return ok(null) when setting not found', async () => {
      vi.mocked(mockPrisma.setting.findUnique).mockResolvedValue(null);

      const result = await repo.findByKey('nonexistent');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeNull();
      }
    });

    it('should return err on Prisma error', async () => {
      vi.mocked(mockPrisma.setting.findUnique).mockRejectedValue(new Error('DB connection lost'));

      const result = await repo.findByKey('join_mode');
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(SETTINGS_ERRORS.REPOSITORY_ERROR);
      }
    });
  });

  describe('findAll', () => {
    it('should return all settings', async () => {
      vi.mocked(mockPrisma.setting.findMany).mockResolvedValue([mockRecord]);

      const result = await repo.findAll();
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(1);
      }
    });
  });

  describe('upsert', () => {
    it('should upsert a setting', async () => {
      const updated = { ...mockRecord, value: '"CLOSED"' };
      vi.mocked(mockPrisma.setting.upsert).mockResolvedValue(updated);

      const result = await repo.upsert('join_mode', '"CLOSED"', 'admin-1');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.value).toBe('"CLOSED"');
      }
      expect(mockPrisma.setting.upsert).toHaveBeenCalledWith({
        where: { key: 'join_mode' },
        update: { value: '"CLOSED"', updatedBy: 'admin-1' },
        create: { key: 'join_mode', value: '"CLOSED"', createdBy: 'admin-1', updatedBy: 'admin-1' },
      });
    });

    it('should return err on Prisma error', async () => {
      vi.mocked(mockPrisma.setting.upsert).mockRejectedValue(new Error('constraint violation'));

      const result = await repo.upsert('join_mode', '"CLOSED"', null);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(SETTINGS_ERRORS.REPOSITORY_ERROR);
      }
    });
  });

  describe('deleteByKey', () => {
    it('should delete a setting', async () => {
      vi.mocked(mockPrisma.setting.delete).mockResolvedValue(mockRecord);

      const result = await repo.deleteByKey('join_mode');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.key).toBe('join_mode');
      }
    });

    it('should return err on Prisma error', async () => {
      vi.mocked(mockPrisma.setting.delete).mockRejectedValue(new Error('record not found'));

      const result = await repo.deleteByKey('nonexistent');
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(SETTINGS_ERRORS.REPOSITORY_ERROR);
      }
    });
  });
});
