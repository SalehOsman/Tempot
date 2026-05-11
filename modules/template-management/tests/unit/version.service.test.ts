import { describe, it, expect } from 'vitest';
import { VersionService } from '../../services/version.service.js';
import type { Template, TemplateVersion } from '../../types/template.types.js';
import { TemplateStatus } from '../../types/template.types.js';

function makeTemplate(overrides: Partial<Template> = {}): Template {
  return {
    id: 'tmpl-1',
    name: 'Test',
    description: 'Desc',
    slug: 'test',
    status: TemplateStatus.PUBLISHED,
    content: {
      commands: [{ name: 'start', description: 'Start' }],
      messages: [{ key: 'welcome', defaultText: { ar: 'مرحبا' } }],
    },
    categoryId: 'cat-1',
    authorId: 'user-1',
    clonedFrom: null,
    language: 'ar',
    usageCount: 0,
    ratingAvg: 0,
    ratingCount: 0,
    currentVersion: '1.0.0',
    isOfficial: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    isDeleted: false,
    deletedAt: null,
    deletedBy: null,
    ...overrides,
  };
}

function makeVersion(overrides: Partial<TemplateVersion> = {}): TemplateVersion {
  return {
    id: 'ver-1',
    templateId: 'tmpl-1',
    version: '1.0.0',
    content: {
      commands: [{ name: 'start', description: 'Start' }],
      messages: [{ key: 'welcome', defaultText: { ar: 'مرحبا' } }],
    },
    metadata: {
      name: 'Test',
      description: 'Desc',
      categorySlug: null,
      tags: [],
      language: 'ar',
      isOfficial: false,
    },
    changeSummary: null,
    publishedBy: 'user-1',
    createdAt: new Date(),
    ...overrides,
  };
}

describe('VersionService.suggestBumpType', () => {
  const service = new VersionService({} as never, {} as never, {} as never);

  it('returns minor when no previous version exists', () => {
    const template = makeTemplate();
    expect(service.suggestBumpType(template, null)).toBe('minor');
  });

  it('returns major when commands are removed', () => {
    const prev = makeVersion({
      content: {
        commands: [
          { name: 'start', description: 'Start' },
          { name: 'help', description: 'Help' },
        ],
        messages: [{ key: 'x', defaultText: { ar: 'x' } }],
      },
    });
    const template = makeTemplate({
      content: {
        commands: [{ name: 'start', description: 'Start' }],
        messages: [{ key: 'x', defaultText: { ar: 'x' } }],
      },
    });
    expect(service.suggestBumpType(template, prev)).toBe('major');
  });

  it('returns minor when new commands are added', () => {
    const prev = makeVersion({
      content: {
        commands: [{ name: 'start', description: 'Start' }],
        messages: [{ key: 'x', defaultText: { ar: 'x' } }],
      },
    });
    const template = makeTemplate({
      content: {
        commands: [
          { name: 'start', description: 'Start' },
          { name: 'help', description: 'Help' },
        ],
        messages: [{ key: 'x', defaultText: { ar: 'x' } }],
      },
    });
    expect(service.suggestBumpType(template, prev)).toBe('minor');
  });

  it('returns patch when only descriptions change', () => {
    const prev = makeVersion({
      content: {
        commands: [{ name: 'start', description: 'Start old' }],
        messages: [{ key: 'x', defaultText: { ar: 'x' } }],
      },
    });
    const template = makeTemplate({
      content: {
        commands: [{ name: 'start', description: 'Start new' }],
        messages: [{ key: 'x', defaultText: { ar: 'x' } }],
      },
    });
    expect(service.suggestBumpType(template, prev)).toBe('patch');
  });
});
