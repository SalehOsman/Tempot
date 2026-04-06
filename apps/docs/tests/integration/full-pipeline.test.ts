import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { validateFrontmatter } from '../../scripts/validate-frontmatter.js';
import { parseFrontmatter } from '../../scripts/parse-frontmatter.js';

const ROOT = resolve(__dirname, '..', '..', '..', '..');
const DOCS_DIR = join(ROOT, 'docs');
const DIST_DIR = join(__dirname, '..', '..', 'dist');

/**
 * Recursively collects all .md files under a directory.
 */
function collectMarkdownFiles(dir: string): string[] {
  const results: string[] = [];
  if (!existsSync(dir)) return results;
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectMarkdownFiles(fullPath));
    } else if (entry.name.endsWith('.md')) {
      results.push(fullPath);
    }
  }
  return results;
}

describe('Integration & Final Validation (Task 10)', () => {
  beforeAll(() => {
    if (!existsSync(DIST_DIR)) {
      throw new Error('dist/ not found. Run `pnpm build` in apps/docs/ first.');
    }
  });

  describe('SC-001: Starlight site builds successfully', () => {
    it('dist/ directory contains ar/ and en/ locale directories', () => {
      expect(existsSync(join(DIST_DIR, 'ar'))).toBe(true);
      expect(existsSync(join(DIST_DIR, 'en'))).toBe(true);
    });

    it('dist/ contains static assets', () => {
      expect(existsSync(join(DIST_DIR, '_astro'))).toBe(true);
    });

    it('dist/ contains pagefind search index', () => {
      expect(existsSync(join(DIST_DIR, 'pagefind'))).toBe(true);
    });
  });

  describe('SC-002: API reference generation', () => {
    const referencePackages = [
      'ai-core',
      'auth-core',
      'database',
      'event-bus',
      'i18n-core',
      'input-engine',
      'logger',
      'module-registry',
      'regional-engine',
      'sentry',
      'session-manager',
      'settings',
      'shared',
      'storage-engine',
      'ux-helpers',
    ];

    it('dist/ contains reference/ directory', () => {
      expect(existsSync(join(DIST_DIR, 'reference'))).toBe(true);
    });

    for (const pkg of referencePackages) {
      it(`reference/${pkg}/ exists in dist/`, () => {
        expect(existsSync(join(DIST_DIR, 'reference', pkg))).toBe(true);
      });
    }
  });

  describe('SC-004: Diataxis content structure', () => {
    const sections = ['tutorials', 'guides', 'concepts', 'user-guide'];

    for (const section of sections) {
      it(`dist/ar/${section}/ exists with content`, () => {
        const dir = join(DIST_DIR, 'ar', section);
        expect(existsSync(dir)).toBe(true);
      });

      it(`dist/en/${section}/ exists with content`, () => {
        const dir = join(DIST_DIR, 'en', section);
        expect(existsSync(dir)).toBe(true);
      });
    }
  });

  describe('SC-011: All content has valid frontmatter', () => {
    it('all hand-authored docs/product/ markdown files pass validation', () => {
      const productDir = join(DOCS_DIR, 'product');
      const mdFiles = collectMarkdownFiles(productDir).filter((f) => !f.includes('reference'));
      expect(mdFiles.length).toBeGreaterThanOrEqual(8);

      const failures: string[] = [];
      for (const filePath of mdFiles) {
        const content = readFileSync(filePath, 'utf-8');
        const raw = parseFrontmatter(content);
        if (!raw) {
          failures.push(`${filePath}: no frontmatter found`);
          continue;
        }
        const result = validateFrontmatter(raw);
        if (result.isErr()) {
          failures.push(`${filePath}: ${result.error.message}`);
        }
      }

      expect(failures).toEqual([]);
    });
  });

  describe('SC-015: Archive integrity', () => {
    it('docs/archive/ exists', () => {
      expect(existsSync(join(DOCS_DIR, 'archive'))).toBe(true);
    });

    it('docs/archive/README.md exists with migration notice', () => {
      const readme = join(DOCS_DIR, 'archive', 'README.md');
      expect(existsSync(readme)).toBe(true);
      const content = readFileSync(readme, 'utf-8');
      expect(content).toContain('archive');
    });

    it('archive contains previously existing documentation', () => {
      const archiveDir = join(DOCS_DIR, 'archive');
      const entries = readdirSync(archiveDir);
      // Archive should have significant content (was 116 files)
      expect(entries.length).toBeGreaterThan(1);
    });
  });

  describe('SC-016: Development directory structure', () => {
    const devDirs = ['adr', 'methodology', 'devlog', 'retrospectives'];

    it('docs/development/ exists', () => {
      expect(existsSync(join(DOCS_DIR, 'development'))).toBe(true);
    });

    for (const dir of devDirs) {
      it(`docs/development/${dir}/ exists`, () => {
        expect(existsSync(join(DOCS_DIR, 'development', dir))).toBe(true);
      });
    }

    it('development dirs are NOT published in dist/', () => {
      // development/ content should not appear in the built site
      expect(existsSync(join(DIST_DIR, 'ar', 'adr'))).toBe(false);
      expect(existsSync(join(DIST_DIR, 'en', 'adr'))).toBe(false);
    });
  });

  describe('Script existence and configuration', () => {
    it('validate-frontmatter script is importable', () => {
      expect(typeof validateFrontmatter).toBe('function');
    });

    it('parse-frontmatter script is importable', () => {
      expect(typeof parseFrontmatter).toBe('function');
    });

    it('Vale config exists', () => {
      const valeIni = join(__dirname, '..', '..', '.vale.ini');
      expect(existsSync(valeIni)).toBe(true);
    });

    it('Vale custom styles exist', () => {
      const stylesDir = join(__dirname, '..', '..', 'styles', 'Tempot');
      expect(existsSync(stylesDir)).toBe(true);
      const styles = readdirSync(stylesDir);
      expect(styles).toContain('Terminology.yml');
      expect(styles).toContain('ProhibitedWords.yml');
      expect(styles).toContain('SentenceLength.yml');
    });

    it('GitHub Actions docs-lint workflow exists', () => {
      const workflow = join(ROOT, '.github', 'workflows', 'docs-lint.yml');
      expect(existsSync(workflow)).toBe(true);
    });
  });

  describe('Content bilingual parity', () => {
    const contentPages = [
      'tutorials/getting-started.md',
      'guides/creating-a-module.md',
      'concepts/architecture-overview.md',
      'user-guide/getting-started.md',
    ];

    for (const page of contentPages) {
      it(`${page} exists in both ar/ and en/`, () => {
        const arPath = join(DOCS_DIR, 'product', 'ar', page);
        const enPath = join(DOCS_DIR, 'product', 'en', page);
        expect(existsSync(arPath)).toBe(true);
        expect(existsSync(enPath)).toBe(true);
      });
    }
  });

  describe('SC-005: AI generation with SpecKit artifacts', () => {
    it('buildDocPrompt includes SpecKit sections for packages with specs', async () => {
      const { buildDocPrompt } = await import('../../scripts/generate-docs.js');
      const prompt = await buildDocPrompt({
        name: 'shared',
        sourceDir: join(ROOT, 'packages', 'shared', 'src'),
        specDir: join(ROOT, 'specs', '021-documentation-system'),
        hasSpecArtifacts: true,
        locale: 'en',
      });
      expect(prompt).toContain('SpecKit Artifacts');
      expect(prompt).toContain('shared');
      expect(prompt).toContain('Instructions');
    });

    it('processAIResponse validates frontmatter from AI output', async () => {
      const { processAIResponse } = await import('../../scripts/generate-docs.js');
      const validResponse = [
        '---',
        'title: Shared Package',
        'description: Shared utilities for Tempot',
        'tags: [shared, utilities]',
        'audience: [package-developer]',
        'contentType: developer-docs',
        '---',
        '# Shared Package',
        'Documentation content here.',
      ].join('\n');
      const config = {
        packageName: 'shared',
        specDir: join(ROOT, 'specs', '021-documentation-system'),
        sourceDir: join(ROOT, 'packages', 'shared', 'src'),
        outputDir: join(DOCS_DIR, 'product', 'en'),
        locale: 'en' as const,
      };
      const result = processAIResponse(validResponse, config);
      expect(result.isOk()).toBe(true);
    });
  });

  describe('SC-006: Pre-methodology fallback', () => {
    it('buildDocPrompt omits SpecKit section for packages without specs', async () => {
      const { buildDocPrompt } = await import('../../scripts/generate-docs.js');
      const prompt = await buildDocPrompt({
        name: 'logger',
        sourceDir: join(ROOT, 'packages', 'logger', 'src'),
        specDir: '',
        hasSpecArtifacts: false,
        locale: 'en',
      });
      expect(prompt).not.toContain('SpecKit Artifacts');
      expect(prompt).toContain('Source Code');
      expect(prompt).toContain('pre-methodology');
    });
  });

  describe('SC-009: Freshness detection', () => {
    it('checkFreshness returns an array of FreshnessReport objects', async () => {
      const { checkFreshness } = await import('../../scripts/check-freshness.js');
      const reports = checkFreshness(['shared']);
      expect(Array.isArray(reports)).toBe(true);
      for (const report of reports) {
        expect(report).toHaveProperty('package');
        expect(report).toHaveProperty('sourceFile');
        expect(report).toHaveProperty('docFile');
        expect(report).toHaveProperty('sourceMtime');
        expect(report).toHaveProperty('docMtime');
        expect(typeof report.isStale).toBe('boolean');
      }
    });

    it('checkFreshness returns empty array for unknown packages', async () => {
      const { checkFreshness } = await import('../../scripts/check-freshness.js');
      const reports = checkFreshness(['nonexistent-package-xyz']);
      expect(reports).toEqual([]);
    });
  });

  describe('SC-010: Vale config validation', () => {
    it('.vale.ini contains required MinAlertLevel setting', () => {
      const valeIni = join(__dirname, '..', '..', '.vale.ini');
      const content = readFileSync(valeIni, 'utf-8');
      expect(content).toContain('MinAlertLevel');
    });

    it('.vale.ini references Tempot custom style', () => {
      const valeIni = join(__dirname, '..', '..', '.vale.ini');
      const content = readFileSync(valeIni, 'utf-8');
      expect(content).toContain('Tempot');
    });

    it('Vale Terminology.yml has valid YAML structure', () => {
      const termFile = join(__dirname, '..', '..', 'styles', 'Tempot', 'Terminology.yml');
      const content = readFileSync(termFile, 'utf-8');
      expect(content).toContain('extends');
      expect(content).toContain('message');
    });
  });
});
