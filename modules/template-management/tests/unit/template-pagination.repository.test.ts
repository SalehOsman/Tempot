import { describe, expect, it, vi } from 'vitest';
import type { IAuditLogger } from '@tempot/database';
import { TemplateRepository } from '../../repositories/template.repository.js';
import { TemplateStatus, type Template } from '../../types/template.types.js';

const auditLogger: IAuditLogger = { log: vi.fn().mockResolvedValue(undefined) };

function template(id: string): Template {
  return {
    id,
    name: `Template ${id}`,
    description: 'Fixture template',
    slug: `template-${id}`,
    status: TemplateStatus.PUBLISHED,
    content: { commands: [], messages: [] },
    categoryId: 'category-1',
    authorId: 'author-1',
    clonedFrom: null,
    language: 'en',
    usageCount: 0,
    ratingAvg: 0,
    ratingCount: 0,
    currentVersion: null,
    isOfficial: false,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    isDeleted: false,
    deletedAt: null,
    deletedBy: null,
  };
}

describe('TemplateRepository aggregate pagination', () => {
  it('uses aggregate count for filtered search totals', async () => {
    const findMany = vi.fn().mockResolvedValue([template('1')]);
    const count = vi.fn().mockResolvedValue(42);
    const repository = new TemplateRepository(auditLogger, {
      template: { findMany, count },
    } as unknown as ConstructorParameters<typeof TemplateRepository>[1]);

    const result = await repository.search({
      filters: { authorId: 'author-1' },
      sort: 'created',
      page: 2,
      pageSize: 10,
    });

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap().totalCount).toBe(42);
    expect(findMany).toHaveBeenCalledTimes(1);
    expect(count).toHaveBeenCalledWith({
      where: { status: TemplateStatus.PUBLISHED, authorId: 'author-1', isDeleted: false },
    });
  });
});
