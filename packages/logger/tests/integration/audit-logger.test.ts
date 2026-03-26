import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { TestDB } from '@tempot/database/testing';
import { AuditLogRepository, IAuditLogger } from '@tempot/database';
import { AuditLogger, AuditLogEntry } from '../../src/audit/audit.logger.js';
import { sessionContext } from '@tempot/session-manager/context';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('AuditLogger Integration', () => {
  const testDb = new TestDB();
  let auditLogger: AuditLogger;

  beforeAll(async () => {
    await testDb.start();
    // Run schema push for integration tests
    execSync('cmd.exe /c pnpm prisma db push --accept-data-loss', {
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
      cwd: path.resolve(__dirname, '../../../../packages/database'),
    });

    const mockAuditLogger = {
      log: vi.fn().mockResolvedValue(undefined),
    } as unknown as IAuditLogger;
    const repository = new AuditLogRepository(mockAuditLogger, testDb.prisma);
    auditLogger = new AuditLogger(repository);
  }, 120_000);

  afterAll(async () => {
    await testDb.stop();
  });

  it('should log an entry with merged session data', async () => {
    const entry: AuditLogEntry = {
      action: 'test.action',
      module: 'test.module',
      targetId: 'test-target-id',
    };

    const result = await sessionContext.run(
      { userId: 'test-user-id', userRole: 'ADMIN' },
      async () => {
        return await auditLogger.log(entry);
      },
    );
    expect(result.isOk()).toBe(true);

    const logEntry = await testDb.prisma.auditLog.findFirst({
      where: { action: 'test.action' },
    });

    expect(logEntry).toBeDefined();
    // In our mock session context, the values are 'test-user-id' and 'ADMIN'
    expect(logEntry?.userId).toBe('test-user-id');
    expect(logEntry?.userRole).toBe('ADMIN');
    expect(logEntry?.module).toBe('test.module');
    expect(logEntry?.targetId).toBe('test-target-id');
  });

  it('should override session data if provided in entry', async () => {
    const entry: AuditLogEntry = {
      action: 'override.action',
      module: 'test.module',
      userId: 'custom-user-id',
      userRole: 'CUSTOM_ROLE',
    };

    const result = await auditLogger.log(entry);
    expect(result.isOk()).toBe(true);

    const logEntry = await testDb.prisma.auditLog.findFirst({
      where: { action: 'override.action' },
    });

    expect(logEntry?.userId).toBe('custom-user-id');
    expect(logEntry?.userRole).toBe('CUSTOM_ROLE');
  });
});
