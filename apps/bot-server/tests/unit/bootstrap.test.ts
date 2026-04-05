import { describe, it, expect, vi, beforeEach } from 'vitest';
import { bootstrapSuperAdmins } from '../../src/startup/bootstrap.js';
import { BOT_SERVER_ERRORS } from '../../src/bot-server.errors.js';

const mockPrisma = {
  session: {
    upsert: vi.fn().mockResolvedValue({}),
  },
};

const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  child: vi.fn().mockReturnThis(),
};

describe('bootstrapSuperAdmins', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should upsert each super admin ID with correct args', async () => {
    const result = await bootstrapSuperAdmins([123, 456], {
      prisma: mockPrisma,
      logger: mockLogger,
    });

    expect(result.isOk()).toBe(true);
    expect(mockPrisma.session.upsert).toHaveBeenCalledTimes(2);

    expect(mockPrisma.session.upsert).toHaveBeenCalledWith({
      where: { userId_chatId: { userId: '123', chatId: '123' } },
      update: { role: 'SUPER_ADMIN' },
      create: {
        userId: '123',
        chatId: '123',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        language: 'ar-EG',
      },
    });

    expect(mockPrisma.session.upsert).toHaveBeenCalledWith({
      where: { userId_chatId: { userId: '456', chatId: '456' } },
      update: { role: 'SUPER_ADMIN' },
      create: {
        userId: '456',
        chatId: '456',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        language: 'ar-EG',
      },
    });
  });

  it('should log warning and skip upsert when IDs list is empty', async () => {
    const result = await bootstrapSuperAdmins([], {
      prisma: mockPrisma,
      logger: mockLogger,
    });

    expect(result.isOk()).toBe(true);
    expect(mockLogger.warn).toHaveBeenCalledWith('No super admin IDs configured');
    expect(mockPrisma.session.upsert).not.toHaveBeenCalled();
  });

  it('should return ok when upsert succeeds for existing user (idempotent)', async () => {
    mockPrisma.session.upsert.mockResolvedValueOnce({
      userId: '999',
      chatId: '999',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    });

    const result = await bootstrapSuperAdmins([999], {
      prisma: mockPrisma,
      logger: mockLogger,
    });

    expect(result.isOk()).toBe(true);
    expect(mockPrisma.session.upsert).toHaveBeenCalledTimes(1);
  });

  it('should return err with SUPER_ADMIN_BOOTSTRAP_FAILED when upsert throws', async () => {
    mockPrisma.session.upsert.mockRejectedValueOnce(new Error('DB connection lost'));

    const result = await bootstrapSuperAdmins([111], {
      prisma: mockPrisma,
      logger: mockLogger,
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe(BOT_SERVER_ERRORS.SUPER_ADMIN_BOOTSTRAP_FAILED);
    }
  });

  it('should return ok on success with non-empty list', async () => {
    const result = await bootstrapSuperAdmins([10, 20, 30], {
      prisma: mockPrisma,
      logger: mockLogger,
    });

    expect(result.isOk()).toBe(true);
    expect(mockPrisma.session.upsert).toHaveBeenCalledTimes(3);
    expect(mockLogger.info).toHaveBeenCalled();
  });
});
