import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TestDB } from '../../src/testing/database.helper.js';

describe('AuditLog Schema', () => {
  const testDb = new TestDB();

  beforeAll(async () => {
    await testDb.start();
    testDb.applyPrismaSchema();
  }, 120_000);

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
