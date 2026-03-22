import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TestDB } from '../../../../packages/database/tests/utils/test-db';
import { AuditLogger, AuditLogEntry } from '../../src/audit/audit.logger';
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

    auditLogger = new AuditLogger(testDb.prisma);
  }, 60000);

  afterAll(async () => {
    await testDb.stop();
  });

  it('should log an entry with merged session data', async () => {
    const entry: AuditLogEntry = {
      action: 'test.action',
      module: 'test.module',
      targetId: 'test-target-id',
    };

    const result = await auditLogger.log(entry);
    expect(result.isOk()).toBe(true);

    const logEntry = await testDb.prisma.auditLog.findFirst({
      where: { action: 'test.action' },
    });

    expect(logEntry).toBeDefined();
    expect(logEntry?.userId).toBe('test-user-id'); // From mock sessionContext
    expect(logEntry?.userRole).toBe('ADMIN'); // From mock sessionContext
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
