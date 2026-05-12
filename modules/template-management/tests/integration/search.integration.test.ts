import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TestDB } from '@tempot/database/testing';
import type { IAuditLogger } from '@tempot/database';
import { TemplateRepository } from '../../repositories/template.repository.js';
import { SearchService } from '../../services/search.service.js';
import { TemplateStatus } from '../../types/template.types.js';

const mockAuditLogger: IAuditLogger = { log: async () => {} };

describe('Search Integration', () => {
  const testDb = new TestDB();
  let templateRepo: TemplateRepository;
  let searchService: SearchService;

  beforeAll(async () => {
    await testDb.start();
    testDb.applyPrismaSchema();
    templateRepo = new TemplateRepository(mockAuditLogger, testDb.prisma);
    searchService = new SearchService(templateRepo);

    for (let i = 0; i < 5; i++) {
      await templateRepo.create({
        name: `Published Bot ${i}`,
        description: `Bot number ${i}`,
        slug: `search-bot-${i}`,
        status: TemplateStatus.PUBLISHED,
        content: { commands: [{ name: 'start', description: 'Start' }], messages: [] },
        categoryId: null,
        authorId: 'author-1',
        clonedFrom: null,
        language: 'ar',
        usageCount: i * 10,
        ratingAvg: i,
        ratingCount: i * 5,
        currentVersion: '1.0.0',
        isOfficial: false,
      });
    }
  }, 120_000);

  afterAll(async () => {
    await testDb.stop();
  });

  it('returns published templates in browse', async () => {
    const result = await searchService.browse({});
    expect(result.isOk()).toBe(true);
    const data = result._unsafeUnwrap();
    expect(data.templates.length).toBeGreaterThan(0);
    expect(data.totalCount).toBeGreaterThanOrEqual(5);
  });

  it('paginates correctly', async () => {
    const page0 = await searchService.browse({ pageSize: 2, page: 0 });
    expect(page0.isOk()).toBe(true);
    expect(page0._unsafeUnwrap().templates.length).toBe(2);

    const page1 = await searchService.browse({ pageSize: 2, page: 1 });
    expect(page1.isOk()).toBe(true);
    expect(page1._unsafeUnwrap().templates.length).toBe(2);

    const ids0 = page0._unsafeUnwrap().templates.map((t) => t.id);
    const ids1 = page1._unsafeUnwrap().templates.map((t) => t.id);
    const overlap = ids0.filter((id) => ids1.includes(id));
    expect(overlap.length).toBe(0);
  });

  it('search returns empty for non-matching filter', async () => {
    const result = await searchService.search({ categoryId: 'nonexistent-cat' });
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap().templates.length).toBe(0);
  });
});
