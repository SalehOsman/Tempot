import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Sovereign i18n & Zero Hardcoded Strings Sentinel Test
 * Validates Taboo 11 across all packages, modules, and apps.
 */
describe('Sovereign i18n & Zero Hardcoded Strings Sentinel (Taboo 11)', () => {
  function walk(dir: string): string[] {
    let results: string[] = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of list) {
      if (
        entry.name === 'node_modules' ||
        entry.name === 'dist' ||
        entry.name === '.git' ||
        entry.name === '.turbo' ||
        entry.name === 'coverage'
      ) {
        continue;
      }
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results = results.concat(walk(full));
      } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
        const normalized = full.replace(/\\/g, '/');
        const isLocale = normalized.includes('/locales/') || normalized.endsWith('locales.ts');
        const isTest =
          normalized.includes('/test/') ||
          normalized.endsWith('.test.ts') ||
          normalized.endsWith('.spec.ts');

        if (!isLocale && !isTest) {
          results.push(full);
        }
      }
    }
    return results;
  }

  it('enforces that zero non-locale source files contain hardcoded Arabic literals', () => {
    const targetDirs = [
      path.resolve(__dirname, '../../../packages'),
      path.resolve(__dirname, '../../../modules'),
      path.resolve(__dirname, '../../../apps'),
    ];

    const arabicRegex = /[\u0600-\u06FF]/;
    const violations: string[] = [];

    for (const dir of targetDirs) {
      const files = walk(dir);
      for (const file of files) {
        const lines = fs.readFileSync(file, 'utf8').split('\n');
        lines.forEach((line, idx) => {
          if (arabicRegex.test(line)) {
            violations.push(`${file.replace(/\\/g, '/')}:${idx + 1}: ${line.trim()}`);
          }
        });
      }
    }

    expect(
      violations,
      `Taboo 11 Violation: Detected ${violations.length} hardcoded Arabic strings outside locales:\n${violations.slice(0, 15).join('\n')}`,
    ).toEqual([]);
  });
});
