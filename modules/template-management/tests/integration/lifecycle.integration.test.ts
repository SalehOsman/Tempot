import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TestDB } from '@tempot/database/testing';
import type { IAuditLogger } from '@tempot/database';
import { TemplateRepository } from '../../repositories/template.repository.js';
import { LifecycleService } from '../../services/lifecycle.service.js';
import { TemplateStatus } from '../../types/template.types.js';
import type { ModuleEventBus } from '../../index.js';

const mockAuditLogger: IAuditLogger = { log: async () => {} };

function createMockEventBus(): ModuleEventBus {
  return { publish: async () => ({ isOk: () => true }) };
}

describe('Lifecycle Integration', () => {
  const testDb = new TestDB();
  let repo: TemplateRepository;
  let lifecycleService: LifecycleService;
  let categoryId: string;

  beforeAll(async () => {
    await testDb.start();
    testDb.applyPrismaSchema();
    const category = await testDb.prisma.category.create({
      data: {
        nameAr: 'Lifecycle',
        nameEn: 'Lifecycle',
        slug: 'lifecycle',
        depth: 0,
      },
    });
    categoryId = category.id;
    repo = new TemplateRepository(mockAuditLogger, testDb.prisma);
    lifecycleService = new LifecycleService(repo, createMockEventBus());
  }, 120_000);

  afterAll(async () => {
    await testDb.stop();
  });

  async function createTemplate(slug: string, content?: Record<string, unknown>) {
    const result = await repo.create({
      name: 'Lifecycle Test',
      description: 'Desc',
      slug,
      status: TemplateStatus.DRAFT,
      content: content ?? {
        commands: [{ name: 'start', description: 'Start' }],
        messages: [{ key: 'welcome', defaultText: { ar: 'مرحبا' } }],
      },
      categoryId,
      authorId: 'user-1',
      clonedFrom: null,
      language: 'ar',
      usageCount: 0,
      ratingAvg: 0,
      ratingCount: 0,
      currentVersion: null,
      isOfficial: false,
    });
    return result._unsafeUnwrap();
  }

  it('transitions DRAFT -> REVIEW -> PUBLISHED -> ARCHIVED', async () => {
    const template = await createTemplate('lc-full-1');

    const toReview = await lifecycleService.transition({
      templateId: template.id,
      targetStatus: TemplateStatus.REVIEW,
      userId: 'user-1',
      userRole: 'USER',
      isOwner: true,
    });
    expect(toReview.isOk()).toBe(true);
    expect(toReview._unsafeUnwrap().status).toBe(TemplateStatus.REVIEW);

    const toPublished = await lifecycleService.transition({
      templateId: template.id,
      targetStatus: TemplateStatus.PUBLISHED,
      userId: 'admin-1',
      userRole: 'ADMIN',
      isOwner: false,
    });
    expect(toPublished.isOk()).toBe(true);
    expect(toPublished._unsafeUnwrap().status).toBe(TemplateStatus.PUBLISHED);

    const toArchived = await lifecycleService.transition({
      templateId: template.id,
      targetStatus: TemplateStatus.ARCHIVED,
      userId: 'admin-1',
      userRole: 'ADMIN',
      isOwner: false,
      reason: 'Outdated',
    });
    expect(toArchived.isOk()).toBe(true);
    expect(toArchived._unsafeUnwrap().status).toBe(TemplateStatus.ARCHIVED);
  });

  it('rejects invalid transition DRAFT -> PUBLISHED', async () => {
    const template = await createTemplate('lc-invalid-1');

    const result = await lifecycleService.transition({
      templateId: template.id,
      targetStatus: TemplateStatus.PUBLISHED,
      userId: 'user-1',
      userRole: 'USER',
      isOwner: true,
    });
    expect(result.isErr()).toBe(true);
  });

  it('enforces completeness check for DRAFT -> REVIEW', async () => {
    const template = await createTemplate('lc-incomplete-1', {
      commands: [],
      messages: [],
    });

    const result = await lifecycleService.transition({
      templateId: template.id,
      targetStatus: TemplateStatus.REVIEW,
      userId: 'user-1',
      userRole: 'USER',
      isOwner: true,
    });
    expect(result.isErr()).toBe(true);
  });

  it('enforces RBAC role for REVIEW -> PUBLISHED', async () => {
    const template = await createTemplate('lc-rbac-1');

    await lifecycleService.transition({
      templateId: template.id,
      targetStatus: TemplateStatus.REVIEW,
      userId: 'user-1',
      userRole: 'USER',
      isOwner: true,
    });

    const result = await lifecycleService.transition({
      templateId: template.id,
      targetStatus: TemplateStatus.PUBLISHED,
      userId: 'user-1',
      userRole: 'USER',
      isOwner: true,
    });
    expect(result.isErr()).toBe(true);
  });

  it('requires reason for PUBLISHED -> ARCHIVED', async () => {
    const template = await createTemplate('lc-reason-1');

    await lifecycleService.transition({
      templateId: template.id,
      targetStatus: TemplateStatus.REVIEW,
      userId: 'user-1',
      userRole: 'USER',
      isOwner: true,
    });
    await lifecycleService.transition({
      templateId: template.id,
      targetStatus: TemplateStatus.PUBLISHED,
      userId: 'admin-1',
      userRole: 'ADMIN',
      isOwner: false,
    });

    const result = await lifecycleService.transition({
      templateId: template.id,
      targetStatus: TemplateStatus.ARCHIVED,
      userId: 'admin-1',
      userRole: 'ADMIN',
      isOwner: false,
    });
    expect(result.isErr()).toBe(true);
  });
});
