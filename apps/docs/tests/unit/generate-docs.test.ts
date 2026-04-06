import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('node:fs/promises');
vi.mock('node:fs');

describe('generateDocs', () => {
  let discoverPackages: typeof import('../../scripts/generate-docs.js').discoverPackages;
  let buildDocPrompt: typeof import('../../scripts/generate-docs.js').buildDocPrompt;
  let processAIResponse: typeof import('../../scripts/generate-docs.js').processAIResponse;
  let readdir: typeof import('node:fs/promises').readdir;
  let readFile: typeof import('node:fs/promises').readFile;
  let existsSync: typeof import('node:fs').existsSync;

  beforeEach(async () => {
    vi.resetModules();

    const fsPromises = await import('node:fs/promises');
    readdir = fsPromises.readdir;
    readFile = fsPromises.readFile;

    const fs = await import('node:fs');
    existsSync = fs.existsSync;

    const mod = await import('../../scripts/generate-docs.js');
    discoverPackages = mod.discoverPackages;
    buildDocPrompt = mod.buildDocPrompt;
    processAIResponse = mod.processAIResponse;
  });

  describe('discoverPackages', () => {
    it('discovers packages from packages/ directory', async () => {
      vi.mocked(readdir).mockResolvedValueOnce([
        { name: 'shared', isDirectory: () => true, isFile: () => false },
        { name: 'logger', isDirectory: () => true, isFile: () => false },
      ] as unknown as Awaited<ReturnType<typeof readdir>>);

      vi.mocked(existsSync).mockImplementation((path: unknown) => {
        const p = String(path);
        // specs base dir exists
        if (p === 'specs') return true;
        // specs/shared exists and has spec.md
        if (p === 'specs/shared' || p === 'specs/shared/spec.md') return true;
        return false;
      });

      const packages = await discoverPackages();
      expect(packages).toHaveLength(2);
      expect(packages[0].name).toBe('shared');
      expect(packages[0].hasSpecArtifacts).toBe(true);
      expect(packages[1].name).toBe('logger');
      expect(packages[1].hasSpecArtifacts).toBe(false);
    });
  });

  describe('buildDocPrompt', () => {
    it('constructs prompt including SpecKit artifacts for packages with specs', async () => {
      vi.mocked(existsSync).mockImplementation((path: unknown) => {
        const p = String(path);
        if (p.includes('specs/021-shared')) return true;
        return true;
      });

      vi.mocked(readdir).mockResolvedValueOnce([
        { name: 'index.ts', isFile: () => true, isDirectory: () => false },
        { name: 'utils.ts', isFile: () => true, isDirectory: () => false },
      ] as unknown as Awaited<ReturnType<typeof readdir>>);

      vi.mocked(readFile)
        .mockResolvedValueOnce('# Spec\nShared utilities spec')
        .mockResolvedValueOnce('# Plan\nShared plan content')
        .mockResolvedValueOnce('# Data Model\nShared data model')
        .mockResolvedValueOnce('export const VERSION = "1.0.0";')
        .mockResolvedValueOnce('export function util() {}');

      const prompt = await buildDocPrompt({
        name: 'shared',
        sourceDir: 'packages/shared/src',
        specDir: 'specs/021-shared',
        hasSpecArtifacts: true,
        locale: 'en',
      });

      expect(prompt).toContain('shared');
      expect(prompt).toContain('Spec');
      expect(prompt).toContain('Plan');
      expect(prompt).toContain('Data Model');
      expect(prompt).toContain('Starlight');
    });

    it('falls back to source code only for pre-methodology packages', async () => {
      vi.mocked(readdir).mockResolvedValueOnce([
        { name: 'logger.ts', isFile: () => true, isDirectory: () => false },
      ] as unknown as Awaited<ReturnType<typeof readdir>>);

      vi.mocked(readFile).mockResolvedValueOnce(
        '/** Structured logger for Tempot */\nexport function createLogger() {}',
      );

      const stderrSpy = vi.spyOn(process.stderr, 'write').mockReturnValue(true);

      const prompt = await buildDocPrompt({
        name: 'logger',
        sourceDir: 'packages/logger/src',
        specDir: '',
        hasSpecArtifacts: false,
        locale: 'en',
      });

      expect(prompt).toContain('logger');
      expect(prompt).toContain('source code');
      expect(prompt).not.toContain('spec.md');
      expect(stderrSpy).toHaveBeenCalled();
      const stderrOutput = stderrSpy.mock.calls.map((call) => String(call[0])).join('');
      expect(stderrOutput).toContain('logger');

      stderrSpy.mockRestore();
    });
  });

  describe('processAIResponse', () => {
    it('returns ok for valid Starlight Markdown with correct frontmatter', () => {
      const response = [
        '---',
        'title: Shared Package Overview',
        'description: Overview of the shared package',
        'tags:',
        '  - overview',
        'audience:',
        '  - package-developer',
        'contentType: developer-docs',
        'package: shared',
        '---',
        '',
        '## Overview',
        '',
        'The shared package provides common utilities.',
      ].join('\n');

      const result = processAIResponse(response, {
        packageName: 'shared',
        specDir: 'specs/021-shared',
        sourceDir: 'packages/shared/src',
        outputDir: 'docs/product/en/concepts',
        locale: 'en',
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.frontmatter.title).toBe('Shared Package Overview');
        expect(result.value.frontmatter.contentType).toBe('developer-docs');
        expect(result.value.content).toContain('## Overview');
      }
    });

    it('returns err when frontmatter is missing', () => {
      const response = '## Overview\n\nNo frontmatter here.';

      const result = processAIResponse(response, {
        packageName: 'shared',
        specDir: 'specs/021-shared',
        sourceDir: 'packages/shared/src',
        outputDir: 'docs/product/en/concepts',
        locale: 'en',
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe('DOCS_INVALID_FRONTMATTER');
      }
    });

    it('returns err when frontmatter has invalid fields', () => {
      const response = [
        '---',
        'title: Shared Package',
        'description: Overview',
        'tags: []',
        'audience: []',
        'contentType: blog-post',
        '---',
        '',
        '## Content',
      ].join('\n');

      const result = processAIResponse(response, {
        packageName: 'shared',
        specDir: 'specs/021-shared',
        sourceDir: 'packages/shared/src',
        outputDir: 'docs/product/en/concepts',
        locale: 'en',
      });

      expect(result.isErr()).toBe(true);
    });
  });

  describe('CLI argument parsing', () => {
    it('parseCliArgs extracts --package flag', async () => {
      const mod = await import('../../scripts/generate-docs.js');
      const args = mod.parseCliArgs(['--package', 'shared']);
      expect(args.package).toBe('shared');
    });

    it('parseCliArgs returns undefined package when no flag', async () => {
      const mod = await import('../../scripts/generate-docs.js');
      const args = mod.parseCliArgs([]);
      expect(args.package).toBeUndefined();
    });

    it('parseCliArgs extracts --locale flag with default en', async () => {
      const mod = await import('../../scripts/generate-docs.js');
      const args = mod.parseCliArgs([]);
      expect(args.locale).toBe('en');
    });
  });
});
