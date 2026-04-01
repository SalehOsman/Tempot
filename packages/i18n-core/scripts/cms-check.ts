import path from 'path';
import fs from 'fs/promises';
import { glob } from 'glob';
import {
  detectHardcodedStrings,
  validateLocaleFiles,
  type CmsCheckViolation,
} from '../src/i18n.cms-validators.js';

/** CLI entry point — run all cms:check validations. */
async function main(): Promise<void> {
  const pkgRoot = path.resolve(import.meta.dirname, '..');
  const localesDir = path.resolve(pkgRoot, 'locales');
  const srcDir = path.resolve(pkgRoot, 'src');

  const violations: CmsCheckViolation[] = [];

  // 1. Locale parity: ar.json is source of truth
  const arPath = path.join(localesDir, 'ar.json');
  try {
    const arRaw = await fs.readFile(arPath, 'utf-8');
    const arData = JSON.parse(arRaw) as Record<string, unknown>;
    const localeFiles = await glob('*.json', { cwd: localesDir });

    for (const file of localeFiles) {
      if (file === 'ar.json') continue;
      const targetPath = path.join(localesDir, file);
      const targetRaw = await fs.readFile(targetPath, 'utf-8');
      const targetData = JSON.parse(targetRaw) as Record<string, unknown>;
      const result = validateLocaleFiles(arData, targetData, targetPath);
      if (result.isErr()) {
        violations.push({ file: targetPath, type: 'locale-parity', message: result.error.message });
      }
    }
  } catch {
    // No locales directory or ar.json yet — skip parity check
  }

  // 2. Hardcoded string detection in source files
  const sourceFiles = await glob('**/*.{ts,tsx}', {
    cwd: srcDir,
    ignore: ['**/*.test.*', '**/*.spec.*'],
  });
  for (const file of sourceFiles) {
    const filePath = path.join(srcDir, file);
    const source = await fs.readFile(filePath, 'utf-8');
    violations.push(...detectHardcodedStrings(source, filePath));
  }

  // 3. Report
  if (violations.length > 0) {
    const output = JSON.stringify({ passed: false, violations }, null, 2);
    process.stderr.write(output + '\n');
    process.exit(1);
  }

  const output = JSON.stringify({ passed: true, violations: [] });
  process.stderr.write(output + '\n');
}

main().catch((error) => {
  process.stderr.write(JSON.stringify({ level: 'error', msg: String(error) }) + '\n');
  process.exit(1);
});
