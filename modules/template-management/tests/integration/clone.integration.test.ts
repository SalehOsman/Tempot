import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TestDB } from '@tempot/database/testing';
import type { IAuditLogger } from '@tempot/database';
import { TemplateRepository } from '../../repositories/template.repository.js';
import { SubscriptionRepository } from '../../repositories/subscription.repository.js';
import { CloneService } from '../../services/clone.service.js';
import { TemplateStatus } from '../../types/template.types.js';
import type { ModuleEventBus } from '../../index.js';

const mockAuditLogger: IAuditLogger = { log: async () => {} };

function createMockEventBus(): ModuleEventBus {
  return { publish: async () => ({ isOk: () => true }) };
}

describe('Clone Integration', () => {
  const testDb = new TestDB();
  let templateRepo: TemplateRepository;
  let subscriptionRepo: SubscriptionRepository;
  let cloneService: CloneService;

  beforeAll(async () => {
    await testDb.start();
    testDb.applyPrismaSchema();
    templateRepo = new TemplateRepository(mockAuditLogger, testDb.prisma);
    subscriptionRepo = new SubscriptionRepository(mockAuditLogger, testDb.prisma);
    cloneService = new CloneService(templateRepo, subscriptionRepo, createMockEventBus());
  }, 120_000);

  afterAll(async () => {
    await testDb.stop();
  });

  async function createPublishedTemplate(slug: string) {
    const result = await templateRepo.create({
      name: 'Source Template',
      description: 'Source desc',
      slug,
      status: TemplateStatus.PUBLISHED,
      content: { commands: [{ name: 'start', description: 'Start' }], messages: [] },
      categoryId: null,
      authorId: 'author-1',
      clonedFrom: null,
      language: 'ar',
      usageCount: 0,
      ratingAvg: 0,
      ratingCount: 0,
      currentVersion: '1.0.0',
      isOfficial: false,
    });
    return result._unsafeUnwrap();
  }

  it('clones a published template into DRAFT with clonedFrom link', async () => {
    const source = await createPublishedTemplate('clone-src-1');

    const result = await cloneService.clone(source.id, 'user-2');
    expect(result.isOk()).toBe(true);

    const clone = result._unsafeUnwrap();
    expect(clone.status).toBe(TemplateStatus.DRAFT);
    expect(clone.clonedFrom).toBe(source.id);
    expect(clone.authorId).toBe('user-2');
  });

  it('increments usage count on source template', async () => {
    const source = await createPublishedTemplate('clone-src-2');

    await cloneService.clone(source.id, 'user-3');

    const updated = await templateRepo.findById(source.id);
    expect(updated._unsafeUnwrap().usageCount).toBe(1);
  });

  it('auto-subscribes user to source template', async () => {
    const source = await createPublishedTemplate('clone-src-3');

    await cloneService.clone(source.id, 'user-4');

    const isSub = await subscriptionRepo.isSubscribed(source.id, 'user-4');
    expect(isSub._unsafeUnwrap()).toBe(true);
  });

  it('rejects clone of non-published template', async () => {
    const draft = await templateRepo.create({
      name: 'Draft Only',
      description: 'Not published',
      slug: 'clone-draft-1',
      status: TemplateStatus.DRAFT,
      content: { commands: [], messages: [] },
      categoryId: null,
      authorId: 'author-1',
      clonedFrom: null,
      language: 'ar',
      usageCount: 0,
      ratingAvg: 0,
      ratingCount: 0,
      currentVersion: null,
      isOfficial: false,
    });

    const result = await cloneService.clone(draft._unsafeUnwrap().id, 'user-5');
    expect(result.isErr()).toBe(true);
  });
});
