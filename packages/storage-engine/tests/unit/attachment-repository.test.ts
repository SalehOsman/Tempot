import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock @tempot/database before importing AttachmentRepository
vi.mock('@tempot/database', () => {
  class MockBaseRepository {
    protected db: unknown;
    protected auditLogger: unknown;

    constructor(auditLogger: unknown, db: unknown) {
      this.auditLogger = auditLogger;
      this.db = db;
    }

    async findMany(
      where?: Record<string, unknown>,
    ): Promise<{ isOk: () => boolean; value: unknown[] }> {
      const model = (this as unknown as { model: Record<string, (...args: unknown[]) => unknown> })
        .model;
      const items = await model.findMany({ where: { isDeleted: false, ...where } });
      return { isOk: () => true, value: items as unknown[] };
    }
  }

  return {
    BaseRepository: MockBaseRepository,
  };
});

// Must import after the mock
import { AttachmentRepository } from '../../src/attachment.repository.js';

// Create mock audit logger
function createMockAuditLogger() {
  return {
    log: vi.fn().mockResolvedValue(undefined),
  };
}

// Create mock database client with attachment model
function createMockDb() {
  return {
    attachment: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $executeRaw: vi.fn(),
  };
}

describe('AttachmentRepository', () => {
  let repo: AttachmentRepository;
  let mockDb: ReturnType<typeof createMockDb>;
  let mockAuditLogger: ReturnType<typeof createMockAuditLogger>;

  beforeEach(() => {
    mockAuditLogger = createMockAuditLogger();
    mockDb = createMockDb();
    repo = new AttachmentRepository(mockAuditLogger, mockDb as unknown);
  });

  describe('findByModuleAndEntity', () => {
    it('should query by moduleId and entityId', async () => {
      mockDb.attachment.findMany.mockResolvedValue([]);
      const result = await repo.findByModuleAndEntity('chat', 'msg-123');
      expect(result.isOk()).toBe(true);
    });
  });

  describe('findExpiredDeleted', () => {
    it('should query soft-deleted records before date', async () => {
      mockDb.attachment.findMany.mockResolvedValue([]);
      const beforeDate = new Date('2026-01-01');
      const result = await repo.findExpiredDeleted(beforeDate);
      expect(result.isOk()).toBe(true);
    });
  });

  describe('hardDelete', () => {
    it('should execute raw DELETE for permanent removal', async () => {
      mockDb.$executeRaw.mockResolvedValue(3);
      const result = await repo.hardDelete(['id1', 'id2', 'id3']);
      expect(result.isOk()).toBe(true);
      expect(mockDb.$executeRaw).toHaveBeenCalled();
    });

    it('should return HARD_DELETE_FAILED on error', async () => {
      mockDb.$executeRaw.mockRejectedValue(new Error('DB error'));
      const result = await repo.hardDelete(['id1']);
      expect(result.isErr()).toBe(true);
    });
  });
});
