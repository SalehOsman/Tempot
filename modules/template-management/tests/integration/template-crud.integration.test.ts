import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TestDB } from '@tempot/database/testing';
import type { IAuditLogger } from '@tempot/database';
import { TemplateRepository } from '../../repositories/template.repository.js';
import { TemplateStatus } from '../../types/template.types.js';

const mockAuditLogger: IAuditLogger = { log: async () => {} };

describe('Template CRUD Integration', () => {
  const testDb = new TestDB();
  let repo: TemplateRepository;

  beforeAll(async () => {
    await testDb.start();
    testDb.applyPrismaSchema();
    repo = new TemplateRepository(mockAuditLogger, testDb.prisma);
  }, 120_000);

  afterAll(async () => {
    await testDb.stop();
  });

  it('creates a template and returns ok Result', async () => {
    const result = await repo.create({
      name: 'Test Template',
      description: 'A test template',
      slug: 'test-template-1',
      status: TemplateStatus.DRAFT,
      content: { commands: [], messages: [] },
      categoryId: null,
      authorId: 'user-1',
      clonedFrom: null,
      language: 'ar',
      usageCount: 0,
      ratingAvg: 0,
      ratingCount: 0,
      currentVersion: null,
      isOfficial: false,
    });

    expect(result.isOk()).toBe(true);
    const template = result._unsafeUnwrap();
    expect(template.id).toBeDefined();
    expect(template.name).toBe('Test Template');
    expect(template.status).toBe(TemplateStatus.DRAFT);
  });

  it('reads template by id', async () => {
    const createResult = await repo.create({
      name: 'Read Test',
      description: 'Desc',
      slug: 'read-test-1',
      status: TemplateStatus.DRAFT,
      content: { commands: [], messages: [] },
      categoryId: null,
      authorId: 'user-1',
      clonedFrom: null,
      language: 'ar',
      usageCount: 0,
      ratingAvg: 0,
      ratingCount: 0,
      currentVersion: null,
      isOfficial: false,
    });
    const created = createResult._unsafeUnwrap();

    const findResult = await repo.findById(created.id);
    expect(findResult.isOk()).toBe(true);
    expect(findResult._unsafeUnwrap().name).toBe('Read Test');
  });

  it('updates template name and description', async () => {
    const createResult = await repo.create({
      name: 'Original',
      description: 'Old desc',
      slug: 'update-test-1',
      status: TemplateStatus.DRAFT,
      content: { commands: [], messages: [] },
      categoryId: null,
      authorId: 'user-1',
      clonedFrom: null,
      language: 'ar',
      usageCount: 0,
      ratingAvg: 0,
      ratingCount: 0,
      currentVersion: null,
      isOfficial: false,
    });
    const created = createResult._unsafeUnwrap();

    const updateResult = await repo.update(created.id, {
      name: 'Updated',
      description: 'New desc',
    });
    expect(updateResult.isOk()).toBe(true);
    expect(updateResult._unsafeUnwrap().name).toBe('Updated');
    expect(updateResult._unsafeUnwrap().description).toBe('New desc');
  });

  it('soft-deletes template and excludes from queries', async () => {
    const createResult = await repo.create({
      name: 'To Delete',
      description: 'Will be deleted',
      slug: 'delete-test-1',
      status: TemplateStatus.DRAFT,
      content: { commands: [], messages: [] },
      categoryId: null,
      authorId: 'user-1',
      clonedFrom: null,
      language: 'ar',
      usageCount: 0,
      ratingAvg: 0,
      ratingCount: 0,
      currentVersion: null,
      isOfficial: false,
    });
    const created = createResult._unsafeUnwrap();

    const deleteResult = await repo.softDelete(created.id, 'user-1');
    expect(deleteResult.isOk()).toBe(true);

    const slugResult = await repo.findBySlug('delete-test-1');
    expect(slugResult.isErr()).toBe(true);
  });

  it('returns error for nonexistent id', async () => {
    const result = await repo.findById('nonexistent-id-xxx');
    expect(result.isErr()).toBe(true);
  });
});
