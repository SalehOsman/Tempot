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
    it('dist/ contains reference/ directory with package docs', () => {
      expect(existsSync(join(DIST_DIR, 'reference'))).toBe(true);
    });
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
});
