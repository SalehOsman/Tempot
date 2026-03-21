import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TestDB } from '../utils/test-db';

describe('AuditLog Schema', () => {
  const testDb = new TestDB();

  beforeAll(async () => {
    await testDb.start();
    const { execSync } = await import('child_process');
    const path = await import('path');
    execSync('pnpm prisma db push --accept-data-loss', {
      env: process.env,
      cwd: path.resolve(__dirname, '../../'),
    });
  }, 60000);

  afterAll(async () => {
    await testDb.stop();
  });

  it('should allow creating a valid audit log entry', async () => {
    const entry = await testDb.prisma.auditLog.create({
      data: {
        action: 'user.profile.update',
        module: 'users',
        status: 'SUCCESS',
      },
    });
    expect(entry.id).toBeDefined();
    expect(entry.timestamp).toBeDefined();
  });
});
