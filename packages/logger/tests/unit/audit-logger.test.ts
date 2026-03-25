import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuditLogger } from '../../src/audit/audit.logger';
import { AuditLogRepository } from '@tempot/database';
import { sessionContext } from '@tempot/session-manager';

vi.mock('@tempot/session-manager', () => ({
  sessionContext: {
    getStore: vi.fn(),
  },
}));

describe('AuditLogger', () => {
  let mockRepository: AuditLogRepository;
  let auditLogger: AuditLogger;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRepository = {
      create: vi.fn().mockResolvedValue({ isOk: () => true, isErr: () => false }),
    } as unknown as AuditLogRepository;
    auditLogger = new AuditLogger(mockRepository);
  });

  it('should merge userId and userRole from session context when not provided in entry', async () => {
    vi.mocked(sessionContext.getStore).mockReturnValue({
      userId: 'session-user-id',
      userRole: 'ADMIN',
    });

    const result = await auditLogger.log({ action: 'test.action', module: 'test.module' });
    expect(result.isOk()).toBe(true);
    expect(mockRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'session-user-id', userRole: 'ADMIN' }),
    );
  });

  it('should prefer explicit entry values over session context', async () => {
    vi.mocked(sessionContext.getStore).mockReturnValue({
      userId: 'session-user-id',
      userRole: 'ADMIN',
    });

    const result = await auditLogger.log({
      action: 'override.action',
      module: 'test.module',
      userId: 'explicit-user-id',
      userRole: 'CUSTOM_ROLE',
    });

    expect(result.isOk()).toBe(true);
    expect(mockRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'explicit-user-id', userRole: 'CUSTOM_ROLE' }),
    );
  });

  it('should succeed when no session context is available', async () => {
    vi.mocked(sessionContext.getStore).mockReturnValue(undefined);

    const result = await auditLogger.log({ action: 'no-session.action', module: 'test.module' });
    expect(result.isOk()).toBe(true);
  });

  it('should return err when repository fails', async () => {
    vi.mocked(sessionContext.getStore).mockReturnValue(undefined);
    mockRepository = {
      create: vi.fn().mockResolvedValue({
        isOk: () => false,
        isErr: () => true,
        error: new Error('DB error'),
      }),
    } as unknown as AuditLogRepository;
    auditLogger = new AuditLogger(mockRepository);

    const result = await auditLogger.log({ action: 'fail.action', module: 'test.module' });
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.code).toBe('logger.audit_log_failed');
    }
  });
});
