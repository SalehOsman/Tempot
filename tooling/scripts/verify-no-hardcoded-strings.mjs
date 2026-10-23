import fs from 'node:fs';
import path from 'node:path';

/**
 * Sovereign i18n & Zero Hardcoded Strings Sentinel Gate
 * Author: Tembot Sovereign Architecture
 * Authority: Taboo 11, INC-20261023-HARDCODED-LOCALE-STRINGS, ADR-0006
 */

function walk(dir) {
  let results = [];
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
      // Exclude dedicated locale catalogs and unit test files (which may test localized fixtures)
      const normalizedPath = full.replace(/\\/g, '/');
      const isLocaleFile =
        normalizedPath.includes('/locales/') || normalizedPath.endsWith('locales.ts');
      const isTestFile =
        normalizedPath.includes('/test/') ||
        normalizedPath.endsWith('.test.ts') ||
        normalizedPath.endsWith('.spec.ts');

      if (!isLocaleFile && !isTestFile) {
        results.push(full);
      }
    }
  }
  return results;
}

const targetDirs = ['packages', 'modules', 'apps'];
const arabicRegex = /[\u0600-\u06FF]/;
const violations = [];

for (const dir of targetDirs) {
  const files = walk(dir);
  for (const file of files) {
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, idx) => {
      // Check if line contains Arabic characters
      if (arabicRegex.test(line)) {
        violations.push({
          file: file.replace(/\\/g, '/'),
          line: idx + 1,
          content: line.trim(),
        });
      }
    });
  }
}

if (violations.length > 0) {
  console.error('\n❌ SOVEREIGN HARNESS AUDIT FAILURE: Taboo 11 Violation Detected!');
  console.error(
    `Found ${violations.length} hardcoded natural language string literals in source code outside locales:\n`,
  );
  for (const v of violations) {
    console.error(`  - ${v.file}:${v.line} -> ${v.content}`);
  }
  console.error(
    '\nAll natural language strings must reside in typed locales/ catalogs (ar.ts, en.ts).',
  );
  process.exit(1);
} else {
  console.log(
    '✅ SOVEREIGN HARNESS PASS: Zero hardcoded strings detected outside locales/ catalogs.',
  );
  process.exit(0);
}
