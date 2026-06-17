import { describe, expect, it, vi } from 'vitest';
import { AppError } from '@tempot/shared';
import { err, ok } from 'neverthrow';
import { CategoryService } from '../../services/category.service.js';
import { ExportService } from '../../services/export.service.js';
import { RatingService } from '../../services/rating.service.js';
import { SubscriptionService } from '../../services/subscription.service.js';
import { TagService } from '../../services/tag.service.js';
import { TemplateService } from '../../services/template.service.js';
import { VersionService } from '../../services/version.service.js';
import { TEMPLATE_EVENTS } from '../../events/event-names.js';
import type { ModuleEventBus } from '../../index.js';
import type { CategoryRepository } from '../../repositories/category.repository.js';
import type { RatingRepository, RatingStats } from '../../repositories/rating.repository.js';
import type { SubscriptionRepository } from '../../repositories/subscription.repository.js';
import type { TagRepository } from '../../repositories/tag.repository.js';
import type { TemplateRepository } from '../../repositories/template.repository.js';
import type { VersionRepository } from '../../repositories/version.repository.js';
import type {
  Category,
  Tag,
  TemplateRating,
  TemplateSubscription,
} from '../../types/category.types.js';
import type { Template, TemplateVersion } from '../../types/template.types.js';
import { TemplateStatus } from '../../types/template.types.js';

const now = new Date('2026-06-17T00:00:00.000Z');

function category(overrides: Partial<Category> = {}): Category {
  return {
    id: 'cat-1',
    nameAr: 'Category',
    nameEn: 'Category',
    slug: 'category',
    icon: null,
    parentId: null,
    sortOrder: 0,
    depth: 0,
    createdAt: now,
    updatedAt: now,
    isDeleted: false,
    ...overrides,
  };
}

function tag(overrides: Partial<Tag> = {}): Tag {
  return {
    id: 'tag-1',
    name: 'finance',
    slug: 'finance',
    usageCount: 0,
    createdAt: now,
    ...overrides,
  };
}

function rating(overrides: Partial<TemplateRating> = {}): TemplateRating {
  return {
    id: 'rating-1',
    templateId: 'template-1',
    userId: 'user-1',
    stars: 4,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function subscription(overrides: Partial<TemplateSubscription> = {}): TemplateSubscription {
  return {
    id: 'subscription-1',
    templateId: 'template-1',
    userId: 'user-1',
    createdAt: now,
    ...overrides,
  };
}

function template(overrides: Partial<Template> = {}): Template {
  return {
    id: 'template-1',
    name: 'Support Bot',
    description: 'Support template',
    slug: 'support-bot',
    status: TemplateStatus.DRAFT,
    content: {
      commands: [{ name: 'start', description: 'Start command' }],
      messages: [{ key: 'welcome', defaultText: { en: 'Welcome' } }],
      inputForms: [{ name: 'profile', steps: [{ field: 'name', type: 'text', label: 'Name' }] }],
      permissions: [{ action: 'read', subject: 'ticket', minRole: 'agent' }],
      settings: [{ key: 'enabled', type: 'boolean', defaultValue: true, description: 'Enabled' }],
    },
    categoryId: 'cat-1',
    authorId: 'author-1',
    clonedFrom: null,
    language: 'en',
    usageCount: 0,
    ratingAvg: 0,
    ratingCount: 0,
    currentVersion: '1.2.3',
    isOfficial: false,
    createdAt: now,
    updatedAt: now,
    isDeleted: false,
    deletedAt: null,
    deletedBy: null,
    ...overrides,
  };
}

function version(overrides: Partial<TemplateVersion> = {}): TemplateVersion {
  return {
    id: 'version-1',
    templateId: 'template-1',
    version: '1.2.4',
    content: template().content,
    metadata: {
      name: 'Support Bot',
      description: 'Support template',
      categorySlug: null,
      tags: [],
      language: 'en',
      isOfficial: false,
    },
    changeSummary: 'Patch release',
    publishedBy: 'author-1',
    createdAt: now,
    ...overrides,
  };
}

function eventBus(): ModuleEventBus & { publish: ReturnType<typeof vi.fn> } {
  return {
    publish: vi.fn().mockResolvedValue({ isOk: () => true }),
  };
}

describe('CategoryService', () => {
  it('delegates hierarchy and parent lookups to the repository', async () => {
    const root = category();
    const child = category({ id: 'cat-2', parentId: 'cat-1', depth: 1 });
    const repo = {
      createCategory: vi.fn().mockResolvedValue(ok(root)),
      updateCategory: vi.fn().mockResolvedValue(ok(root)),
      softDeleteCategory: vi.fn().mockResolvedValue(ok(undefined)),
      findById: vi.fn().mockResolvedValue(ok(root)),
      findBySlug: vi.fn().mockResolvedValue(ok(root)),
      listHierarchy: vi.fn().mockResolvedValue(ok([root, child])),
      listByParent: vi
        .fn()
        .mockResolvedValueOnce(ok([root]))
        .mockResolvedValueOnce(ok([child])),
    };
    const service = new CategoryService(repo as unknown as CategoryRepository);

    await expect(service.create({ nameAr: 'Root', nameEn: 'Root' })).resolves.toEqual(ok(root));
    await expect(service.update('cat-1', { sortOrder: 1 })).resolves.toEqual(ok(root));
    await expect(service.delete('cat-1')).resolves.toEqual(ok(undefined));
    await expect(service.getById('cat-1')).resolves.toEqual(ok(root));
    await expect(service.getBySlug('root')).resolves.toEqual(ok(root));
    await expect(service.listHierarchy()).resolves.toEqual(ok([root, child]));
    await expect(service.listRoots()).resolves.toEqual(ok([root]));
    await expect(service.listChildren('cat-1')).resolves.toEqual(ok([child]));
    expect(repo.listByParent).toHaveBeenNthCalledWith(1, null);
    expect(repo.listByParent).toHaveBeenNthCalledWith(2, 'cat-1');
  });
});

describe('SubscriptionService', () => {
  it('delegates subscription operations to the repository', async () => {
    const record = subscription();
    const repo = {
      subscribe: vi.fn().mockResolvedValue(ok(record)),
      unsubscribe: vi.fn().mockResolvedValue(ok(undefined)),
      isSubscribed: vi.fn().mockResolvedValue(ok(true)),
      findByTemplate: vi.fn().mockResolvedValue(ok([record])),
      findByUser: vi.fn().mockResolvedValue(ok([record])),
    };
    const service = new SubscriptionService(repo as unknown as SubscriptionRepository);

    await expect(service.subscribe('template-1', 'user-1')).resolves.toEqual(ok(record));
    await expect(service.unsubscribe('template-1', 'user-1')).resolves.toEqual(ok(undefined));
    await expect(service.isSubscribed('template-1', 'user-1')).resolves.toEqual(ok(true));
    await expect(service.getSubscribers('template-1')).resolves.toEqual(ok([record]));
    await expect(service.getUserSubscriptions('user-1')).resolves.toEqual(ok([record]));
  });
});

describe('TagService', () => {
  it('trims tag names and resolves multiple tags in order', async () => {
    const repo = {
      createOrFind: vi
        .fn()
        .mockResolvedValueOnce(ok(tag({ name: 'finance' })))
        .mockResolvedValueOnce(ok(tag({ id: 'tag-2', name: 'support', slug: 'support' }))),
      listPopular: vi.fn().mockResolvedValue(ok([tag()])),
    };
    const service = new TagService(repo as unknown as TagRepository);

    await expect(service.createOrFind(' finance ')).resolves.toEqual(ok(tag({ name: 'finance' })));
    const result = await service.resolveMany(['support']);

    expect(result.isOk()).toBe(true);
    expect(repo.createOrFind).toHaveBeenNthCalledWith(1, 'finance');
    expect(repo.createOrFind).toHaveBeenNthCalledWith(2, 'support');
    await expect(service.listPopular()).resolves.toEqual(ok([tag()]));
  });

  it('rejects empty and overlong tag names before hitting the repository', async () => {
    const repo = {
      createOrFind: vi.fn(),
      listPopular: vi.fn(),
    };
    const service = new TagService(repo as unknown as TagRepository);

    const empty = await service.createOrFind('   ');
    const long = await service.createOrFind('x'.repeat(101));

    expect(empty._unsafeUnwrapErr().code).toBe('template-management.tag_name_empty');
    expect(long._unsafeUnwrapErr().code).toBe('template-management.tag_name_too_long');
    expect(repo.createOrFind).not.toHaveBeenCalled();
  });
});

describe('RatingService', () => {
  it('rejects ratings outside the allowed range', async () => {
    const repo = {
      upsert: vi.fn(),
      calculateStats: vi.fn(),
      findByUserAndTemplate: vi.fn(),
    };
    const service = new RatingService(
      repo as unknown as RatingRepository,
      { updateRatingStats: vi.fn() } as unknown as TemplateRepository,
      eventBus(),
    );

    const result = await service.rate('template-1', 'user-1', 6);

    expect(result._unsafeUnwrapErr().code).toBe('template-management.invalid_rating');
    expect(repo.upsert).not.toHaveBeenCalled();
  });

  it('persists a rating, refreshes aggregate stats, and publishes a rating event', async () => {
    const stats: RatingStats = { average: 4.5, count: 2 };
    const repo = {
      upsert: vi.fn().mockResolvedValue(ok(rating())),
      calculateStats: vi.fn().mockResolvedValue(ok(stats)),
      findByUserAndTemplate: vi.fn().mockResolvedValue(ok(rating())),
    };
    const templateRepository = {
      updateRatingStats: vi.fn().mockResolvedValue(ok(undefined)),
    };
    const bus = eventBus();
    const service = new RatingService(
      repo as unknown as RatingRepository,
      templateRepository as unknown as TemplateRepository,
      bus,
    );

    await expect(service.rate('template-1', 'user-1', 4)).resolves.toEqual(ok(rating()));
    await expect(service.getStats('template-1')).resolves.toEqual(ok(stats));
    await expect(service.getUserRating('template-1', 'user-1')).resolves.toEqual(ok(rating()));
    expect(templateRepository.updateRatingStats).toHaveBeenCalledWith('template-1', 4.5, 2);
    expect(bus.publish).toHaveBeenCalledWith(
      TEMPLATE_EVENTS.RATED,
      expect.objectContaining({ templateId: 'template-1', userId: 'user-1', newAverage: 4.5 }),
    );
  });

  it('returns repository errors without publishing events', async () => {
    const failure = new AppError('template-management.rating_failed');
    const bus = eventBus();
    const service = new RatingService(
      {
        upsert: vi.fn().mockResolvedValue(err(failure)),
        calculateStats: vi.fn(),
        findByUserAndTemplate: vi.fn(),
      } as unknown as RatingRepository,
      { updateRatingStats: vi.fn() } as unknown as TemplateRepository,
      bus,
    );

    const result = await service.rate('template-1', 'user-1', 3);

    expect(result._unsafeUnwrapErr()).toBe(failure);
    expect(bus.publish).not.toHaveBeenCalled();
  });
});

describe('TemplateService', () => {
  it('validates create input before writing to the repository', async () => {
    const repository = {
      create: vi.fn(),
    };
    const service = new TemplateService(repository as unknown as TemplateRepository, eventBus());

    const result = await service.create({ name: '', description: '', language: 'en' }, 'author-1');

    expect(result._unsafeUnwrapErr().code).toBe('template-management.validation_failed');
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('creates draft templates with generated slugs and publishes creation events', async () => {
    const created = template();
    const repository = {
      create: vi.fn().mockResolvedValue(ok(created)),
    };
    const bus = eventBus();
    const service = new TemplateService(repository as unknown as TemplateRepository, bus);

    await expect(
      service.create(
        { name: 'Support Bot', description: 'Support template', language: 'en' },
        'author-1',
      ),
    ).resolves.toEqual(ok(created));

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Support Bot',
        status: TemplateStatus.DRAFT,
        authorId: 'author-1',
        usageCount: 0,
        ratingAvg: 0,
        ratingCount: 0,
      }),
    );
    expect(bus.publish).toHaveBeenCalledWith(
      TEMPLATE_EVENTS.CREATED,
      expect.objectContaining({ templateId: 'template-1', authorId: 'author-1' }),
    );
  });

  it('updates only author-owned draft templates and regenerates the slug when renamed', async () => {
    const repository = {
      findById: vi.fn().mockResolvedValue(ok(template())),
      update: vi.fn().mockResolvedValue(ok(template({ name: 'Renamed' }))),
    };
    const service = new TemplateService(repository as unknown as TemplateRepository, eventBus());

    const result = await service.update('template-1', { name: 'Renamed' }, 'author-1');

    expect(result.isOk()).toBe(true);
    expect(repository.update).toHaveBeenCalledWith(
      'template-1',
      expect.objectContaining({ name: 'Renamed', slug: expect.stringMatching(/^renamed-/) }),
    );
  });

  it('rejects unauthorized or non-draft updates', async () => {
    const unauthorized = new TemplateService(
      { findById: vi.fn().mockResolvedValue(ok(template())) } as unknown as TemplateRepository,
      eventBus(),
    );
    const nonDraft = new TemplateService(
      {
        findById: vi.fn().mockResolvedValue(ok(template({ status: TemplateStatus.PUBLISHED }))),
      } as unknown as TemplateRepository,
      eventBus(),
    );

    const unauthorizedResult = await unauthorized.update('template-1', { name: 'Name' }, 'other');
    const nonDraftResult = await nonDraft.update('template-1', { name: 'Name' }, 'author-1');

    expect(unauthorizedResult._unsafeUnwrapErr().code).toBe('template-management.unauthorized');
    expect(nonDraftResult._unsafeUnwrapErr().code).toBe('template-management.edit_only_in_draft');
  });

  it('soft-deletes author-owned templates and delegates read/list/search operations', async () => {
    const searchResult = { templates: [template()], totalCount: 1, page: 0, pageSize: 10 };
    const repository = {
      findById: vi.fn().mockResolvedValue(ok(template())),
      findBySlug: vi.fn().mockResolvedValue(ok(template())),
      softDelete: vi.fn().mockResolvedValue(ok(undefined)),
      findByAuthor: vi.fn().mockResolvedValue(ok(searchResult)),
      search: vi.fn().mockResolvedValue(ok(searchResult)),
    };
    const bus = eventBus();
    const service = new TemplateService(repository as unknown as TemplateRepository, bus);

    await expect(service.getById('template-1')).resolves.toEqual(ok(template()));
    await expect(service.getBySlug('support-bot')).resolves.toEqual(ok(template()));
    await expect(service.softDelete('template-1', 'author-1')).resolves.toEqual(ok(undefined));
    await expect(service.listByAuthor('author-1')).resolves.toEqual(ok(searchResult));
    await expect(
      service.search({ filters: {}, sort: 'created', page: 0, pageSize: 10 }),
    ).resolves.toEqual(ok(searchResult));
    expect(bus.publish).toHaveBeenCalledWith(
      TEMPLATE_EVENTS.DELETED,
      expect.objectContaining({ templateId: 'template-1', deletedBy: 'author-1' }),
    );
  });
});

describe('ExportService', () => {
  it('exports template bundles and PDF request data', async () => {
    const repository = {
      findById: vi.fn().mockResolvedValue(ok(template())),
    };
    const versionRepository = {
      findByTemplate: vi.fn().mockResolvedValue(ok([version()])),
    };
    const service = new ExportService(
      repository as unknown as TemplateRepository,
      versionRepository as unknown as VersionRepository,
    );

    const json = await service.exportAsJson('template-1', 'author-1');
    const pdf = await service.exportAsPdfRequest('template-1');

    expect(json._unsafeUnwrap().filename).toBe('support-bot-v1.2.3.json');
    expect(json._unsafeUnwrap().bundle.metadata.name).toBe('Support Bot');
    expect(pdf._unsafeUnwrap().data).toMatchObject({
      name: 'Support Bot',
      authorId: 'author-1',
      language: 'en',
    });
  });

  it('continues PDF export when version history cannot be loaded', async () => {
    const service = new ExportService(
      { findById: vi.fn().mockResolvedValue(ok(template())) } as unknown as TemplateRepository,
      {
        findByTemplate: vi
          .fn()
          .mockResolvedValue(err(new AppError('template-management.history_failed'))),
      } as unknown as VersionRepository,
    );

    const result = await service.exportAsPdfRequest('template-1');

    expect(result._unsafeUnwrap().data['versions']).toEqual([]);
  });
});

describe('VersionService', () => {
  it('creates version snapshots, updates the current version, and publishes events', async () => {
    const snapshot = version({ version: '1.2.4' });
    const templateRepository = {
      findById: vi.fn().mockResolvedValue(ok(template())),
      update: vi.fn().mockResolvedValue(ok(template({ currentVersion: '1.2.4' }))),
    };
    const versionRepository = {
      createSnapshot: vi.fn().mockResolvedValue(ok(snapshot)),
      findByTemplate: vi.fn().mockResolvedValue(ok([snapshot])),
      findByVersion: vi.fn().mockResolvedValue(ok(snapshot)),
    };
    const bus = eventBus();
    const service = new VersionService(
      templateRepository as unknown as TemplateRepository,
      versionRepository as unknown as VersionRepository,
      bus,
    );

    await expect(
      service.createSnapshot({
        templateId: 'template-1',
        bumpType: 'patch',
        publishedBy: 'author-1',
        changeSummary: 'Patch release',
      }),
    ).resolves.toEqual(ok(snapshot));
    await expect(service.listVersions('template-1')).resolves.toEqual(ok([snapshot]));
    await expect(service.getVersion('template-1', '1.2.4')).resolves.toEqual(ok(snapshot));
    expect(templateRepository.update).toHaveBeenCalledWith('template-1', {
      currentVersion: '1.2.4',
    });
    expect(bus.publish).toHaveBeenCalledWith(
      TEMPLATE_EVENTS.VERSION_PUBLISHED,
      expect.objectContaining({
        templateId: 'template-1',
        versionId: 'version-1',
        version: '1.2.4',
      }),
    );
  });
});
