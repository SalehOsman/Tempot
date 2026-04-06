import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { load, type CheerioAPI } from 'cheerio';

const DIST_DIR = join(__dirname, '..', '..', 'dist');

function loadPage(relativePath: string): CheerioAPI {
  const filePath = join(DIST_DIR, relativePath);
  if (!existsSync(filePath)) {
    throw new Error(`Built HTML not found: ${filePath}`);
  }
  const html = readFileSync(filePath, 'utf-8');
  return load(html);
}

describe('RTL/LTR Rendering Verification', () => {
  beforeAll(() => {
    if (!existsSync(DIST_DIR)) {
      throw new Error('dist/ directory not found. Run `pnpm build` in apps/docs/ first.');
    }
  });

  describe('Arabic pages (RTL)', () => {
    it('renders with dir="rtl" on <html>', () => {
      const $ = loadPage('ar/index.html');
      expect($('html').attr('dir')).toBe('rtl');
    });

    it('sets lang="ar" on <html>', () => {
      const $ = loadPage('ar/index.html');
      expect($('html').attr('lang')).toBe('ar');
    });

    it('applies dir="rtl" on content pages', () => {
      const $ = loadPage('ar/tutorials/getting-started/index.html');
      expect($('html').attr('dir')).toBe('rtl');
    });
  });

  describe('English pages (LTR)', () => {
    it('renders with dir="ltr" on <html>', () => {
      const $ = loadPage('en/index.html');
      expect($('html').attr('dir')).toBe('ltr');
    });

    it('sets lang="en" on <html>', () => {
      const $ = loadPage('en/index.html');
      expect($('html').attr('lang')).toBe('en');
    });

    it('applies dir="ltr" on content pages', () => {
      const $ = loadPage('en/tutorials/getting-started/index.html');
      expect($('html').attr('dir')).toBe('ltr');
    });
  });

  describe('code blocks within RTL pages', () => {
    it('code blocks retain LTR direction', () => {
      const $ = loadPage('ar/tutorials/getting-started/index.html');
      const codeBlocks = $('pre');
      expect(codeBlocks.length).toBeGreaterThan(0);

      codeBlocks.each((_, el) => {
        const dir = $(el).attr('dir');
        const style = $(el).attr('style') ?? '';
        // Code blocks must NOT be RTL — they are either
        // explicitly LTR, have no dir (browser default LTR for
        // code), or are wrapped in an LTR container.
        expect(dir).not.toBe('rtl');
        if (dir) {
          expect(dir).toBe('ltr');
        }
        // Also verify no RTL override via CSS direction
        expect(style).not.toContain('direction: rtl');
      });
    });
  });

  describe('sidebar navigation', () => {
    it('renders sidebar on Arabic pages', () => {
      const $ = loadPage('ar/tutorials/getting-started/index.html');
      const sidebar = $('nav.sidebar');
      expect(sidebar.length).toBeGreaterThan(0);
    });

    it('renders sidebar on English pages', () => {
      const $ = loadPage('en/tutorials/getting-started/index.html');
      const sidebar = $('nav.sidebar');
      expect(sidebar.length).toBeGreaterThan(0);
    });

    it('sidebar contains navigation links', () => {
      const $ar = loadPage('ar/tutorials/getting-started/index.html');
      const $en = loadPage('en/tutorials/getting-started/index.html');

      const arLinks = $ar('nav.sidebar a[href]');
      const enLinks = $en('nav.sidebar a[href]');

      expect(arLinks.length).toBeGreaterThan(0);
      expect(enLinks.length).toBeGreaterThan(0);
    });
  });

  describe('locale switcher', () => {
    it('Arabic page has locale switcher linking to English', () => {
      const $ = loadPage('ar/tutorials/getting-started/index.html');
      const langSelects = $('starlight-lang-select');
      // Starlight may render multiple selects (desktop + mobile)
      expect(langSelects.length).toBeGreaterThanOrEqual(1);

      const firstSelect = langSelects.first().find('select');
      const enOption = firstSelect
        .find('option')
        .filter((_, el) => $(el).attr('value')?.includes('/en/') ?? false);
      expect(enOption.length).toBe(1);
      expect(enOption.attr('value')).toContain('/en/tutorials/getting-started/');
    });

    it('English page has locale switcher linking to Arabic', () => {
      const $ = loadPage('en/tutorials/getting-started/index.html');
      const langSelects = $('starlight-lang-select');
      expect(langSelects.length).toBeGreaterThanOrEqual(1);

      const firstSelect = langSelects.first().find('select');
      const arOption = firstSelect
        .find('option')
        .filter((_, el) => $(el).attr('value')?.includes('/ar/') ?? false);
      expect(arOption.length).toBe(1);
      expect(arOption.attr('value')).toContain('/ar/tutorials/getting-started/');
    });

    it('locale switcher links to corresponding page, not homepage', () => {
      const $ = loadPage('ar/guides/creating-a-module/index.html');
      const firstSelect = $('starlight-lang-select').first().find('select');
      const enOption = firstSelect
        .find('option')
        .filter((_, el) => $(el).attr('value')?.includes('/en/') ?? false);

      // Should link to /en/guides/creating-a-module/ not /en/
      expect(enOption.attr('value')).toContain('/en/guides/creating-a-module/');
    });
  });
});
