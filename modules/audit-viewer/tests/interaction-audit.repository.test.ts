import { describe, expect, it, vi } from 'vitest';
import { InteractionAuditRepository } from '../repositories/interaction-audit.repository.js';

describe('InteractionAuditRepository', () => {
  it('requests recent failed bot interactions from audit logs', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const repository = new InteractionAuditRepository({ auditLog: { findMany } });

    const result = await repository.findRecentProblems(5);

    expect(result.isOk()).toBe(true);
    expect(findMany).toHaveBeenCalledWith({
      where: {
        status: 'FAILURE',
        module: {
          in: [
            'bot-server',
            'settings-management',
            'notification-center',
            'content-management',
            'audit-viewer',
            'help-center',
            'user-management',
            'bot-management',
            'template-management',
            'input-engine',
          ],
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 5,
    });
  });

  it('sanitizes callback and reference metadata from audit records', async () => {
    const findMany = vi.fn().mockResolvedValue([
      {
        action: 'settings:open',
        module: 'settings-management',
        targetId: 'trace-1',
        status: 'FAILURE',
        timestamp: new Date('2026-05-22T01:00:00.000Z'),
        after: {
          callbackData: 'settings:open',
          callbackNamespace: 'settings',
          referenceCode: 'ERR-20260522-0001',
          errorCode: 'settings.load_failed',
        },
      },
    ]);
    const repository = new InteractionAuditRepository({ auditLog: { findMany } });

    const result = await repository.findRecentProblems(5);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual([
        {
          action: 'settings:open',
          module: 'settings-management',
          traceId: 'trace-1',
          status: 'FAILURE',
          timestamp: '2026-05-22T01:00:00.000Z',
          callbackData: 'settings:open',
          callbackNamespace: 'settings',
          referenceCode: 'ERR-20260522-0001',
          errorCode: 'settings.load_failed',
        },
      ]);
    }
  });

  it('deduplicates repeated records for the same trace', async () => {
    const findMany = vi.fn().mockResolvedValue([
      {
        action: 'settings:open',
        module: 'settings-management',
        targetId: 'trace-1',
        status: 'FAILURE',
        timestamp: new Date('2026-05-22T01:00:02.000Z'),
        after: { referenceCode: 'ERR-20260522-0001' },
      },
      {
        action: 'settings:open',
        module: 'settings-management',
        targetId: 'trace-1',
        status: 'FAILURE',
        timestamp: new Date('2026-05-22T01:00:01.000Z'),
        after: {},
      },
    ]);
    const repository = new InteractionAuditRepository({ auditLog: { findMany } });

    const result = await repository.findRecentProblems(5);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toHaveLength(1);
      expect(result.value[0]?.referenceCode).toBe('ERR-20260522-0001');
    }
  });
});
