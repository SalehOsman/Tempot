import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ok, err } from 'neverthrow';
import { bootstrapSuperAdmins } from '../../src/startup/bootstrap.js';
import { BOT_SERVER_ERRORS } from '../../src/bot-server.errors.js';
import { AppError } from '@tempot/shared';

const mockSessions = {
  upsertSuperAdminSession: vi.fn().mockResolvedValue(ok(undefined)),
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
    mockSessions.upsertSuperAdminSession.mockResolvedValue(ok(undefined));
  });

  it('should upsert each super admin ID through the bootstrap session repository', async () => {
    const result = await bootstrapSuperAdmins([123, 456], {
      sessions: mockSessions,
      logger: mockLogger,
    });

    expect(result.isOk()).toBe(true);
    expect(mockSessions.upsertSuperAdminSession).toHaveBeenCalledTimes(2);

    expect(mockSessions.upsertSuperAdminSession).toHaveBeenCalledWith({
      sessionId: '123:123',
      userId: '123',
      chatId: '123',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      language: 'ar-EG',
    });

    expect(mockSessions.upsertSuperAdminSession).toHaveBeenCalledWith({
      sessionId: '456:456',
      userId: '456',
      chatId: '456',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      language: 'ar-EG',
    });
  });

  it('should log warning and skip upsert when IDs list is empty', async () => {
    const result = await bootstrapSuperAdmins([], {
      sessions: mockSessions,
      logger: mockLogger,
    });

    expect(result.isOk()).toBe(true);
    expect(mockLogger.warn).toHaveBeenCalledWith('No super admin IDs configured');
    expect(mockSessions.upsertSuperAdminSession).not.toHaveBeenCalled();
  });

  it('should return ok when upsert succeeds for existing user (idempotent)', async () => {
    const result = await bootstrapSuperAdmins([999], {
      sessions: mockSessions,
      logger: mockLogger,
    });

    expect(result.isOk()).toBe(true);
    expect(mockSessions.upsertSuperAdminSession).toHaveBeenCalledTimes(1);
  });

  it('should return err with SUPER_ADMIN_BOOTSTRAP_FAILED when repository upsert fails', async () => {
    mockSessions.upsertSuperAdminSession.mockResolvedValueOnce(
      err(new AppError('database.bootstrap_session_upsert_failed')),
    );

    const result = await bootstrapSuperAdmins([111], {
      sessions: mockSessions,
      logger: mockLogger,
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe(BOT_SERVER_ERRORS.SUPER_ADMIN_BOOTSTRAP_FAILED);
    }
  });

  it('should return ok on success with non-empty list', async () => {
    const result = await bootstrapSuperAdmins([10, 20, 30], {
      sessions: mockSessions,
      logger: mockLogger,
    });

    expect(result.isOk()).toBe(true);
    expect(mockSessions.upsertSuperAdminSession).toHaveBeenCalledTimes(3);
    expect(mockLogger.info).toHaveBeenCalled();
  });
});
