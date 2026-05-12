import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TestDB } from '@tempot/database/testing';
import type { IAuditLogger } from '@tempot/database';
import { TemplateRepository } from '../../repositories/template.repository.js';
import { CategoryRepository } from '../../repositories/category.repository.js';
import { TagRepository } from '../../repositories/tag.repository.js';
import { VersionRepository } from '../../repositories/version.repository.js';
import { ExportService } from '../../services/export.service.js';
import { ImportService } from '../../services/import.service.js';
import { TemplateStatus } from '../../types/template.types.js';

const mockAuditLogger: IAuditLogger = { log: async () => {} };

describe('Import/Export Integration', () => {
  const testDb = new TestDB();
  let templateRepo: TemplateRepository;
  let categoryRepo: CategoryRepository;
  let tagRepo: TagRepository;
  let versionRepo: VersionRepository;
  let exportService: ExportService;
  let importService: ImportService;

  beforeAll(async () => {
    await testDb.start();
    testDb.applyPrismaSchema();
    templateRepo = new TemplateRepository(mockAuditLogger, testDb.prisma);
    categoryRepo = new CategoryRepository(mockAuditLogger, testDb.prisma);
    tagRepo = new TagRepository(mockAuditLogger, testDb.prisma);
    versionRepo = new VersionRepository(mockAuditLogger, testDb.prisma);
    exportService = new ExportService(templateRepo, versionRepo);
    importService = new ImportService(templateRepo, categoryRepo, tagRepo);
  }, 120_000);

  afterAll(async () => {
    await testDb.stop();
  });

  it('exports template as valid JSON bundle', async () => {
    const created = await templateRepo.create({
      name: 'Export Test',
      description: 'For export',
      slug: 'export-test-1',
      status: TemplateStatus.PUBLISHED,
      content: {
        commands: [{ name: 'help', description: 'Help' }],
        messages: [{ key: 'hello', defaultText: { ar: 'مرحبا' } }],
      },
      categoryId: null,
      authorId: 'user-1',
      clonedFrom: null,
      language: 'ar',
      usageCount: 0,
      ratingAvg: 0,
      ratingCount: 0,
      currentVersion: '1.0.0',
      isOfficial: false,
    });

    const result = await exportService.exportAsJson(created._unsafeUnwrap().id, 'user-1');
    expect(result.isOk()).toBe(true);

    const { bundle, filename } = result._unsafeUnwrap();
    expect(bundle.$schema).toBe('tempot-template-bundle/1.0');
    expect(bundle.metadata.name).toBe('Export Test');
    expect(filename).toContain('export-test-1');
  });

  it('imports JSON bundle and creates template in DRAFT', async () => {
    const bundle = JSON.stringify({
      $schema: 'tempot-template-bundle/1.0',
      metadata: {
        name: 'Imported Template',
        description: 'From bundle',
        language: 'ar',
        version: '1.0.0',
      },
      content: {
        commands: [{ name: 'start', description: 'Start cmd' }],
        messages: [{ key: 'msg', defaultText: { ar: 'نص' } }],
      },
      exportedAt: new Date().toISOString(),
      exportedBy: 'user-x',
      tempotVersion: '1.0.0',
    });

    const result = await importService.importBundle(bundle, 'user-2');
    expect(result.isOk()).toBe(true);

    const imported = result._unsafeUnwrap();
    expect(imported.name).toBe('Imported Template');
    expect(imported.status).toBe(TemplateStatus.DRAFT);
    expect(imported.authorId).toBe('user-2');
  });

  it('round-trip export->import preserves content', async () => {
    const original = await templateRepo.create({
      name: 'Roundtrip',
      description: 'Roundtrip test',
      slug: 'roundtrip-1',
      status: TemplateStatus.PUBLISHED,
      content: {
        commands: [
          { name: 'a', description: 'A' },
          { name: 'b', description: 'B' },
        ],
        messages: [{ key: 'k1', defaultText: { ar: 'ا', en: 'a' } }],
      },
      categoryId: null,
      authorId: 'user-1',
      clonedFrom: null,
      language: 'ar',
      usageCount: 0,
      ratingAvg: 0,
      ratingCount: 0,
      currentVersion: '2.0.0',
      isOfficial: false,
    });

    const exportResult = await exportService.exportAsJson(original._unsafeUnwrap().id, 'user-1');
    const json = JSON.stringify(exportResult._unsafeUnwrap().bundle);

    const importResult = await importService.importBundle(json, 'user-3');
    expect(importResult.isOk()).toBe(true);

    const imported = importResult._unsafeUnwrap();
    expect(imported.content.commands).toHaveLength(2);
    expect(imported.content.messages).toHaveLength(1);
  });

  it('import with invalid bundle returns error', async () => {
    const result = await importService.importBundle('{"invalid": true}', 'user-1');
    expect(result.isErr()).toBe(true);
  });

  it('rejects bundle exceeding 5MB size limit', async () => {
    const huge = 'x'.repeat(6 * 1024 * 1024);
    const result = await importService.importBundle(huge, 'user-1');
    expect(result.isErr()).toBe(true);
  });
});
