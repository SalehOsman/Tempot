import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const PACKAGE_ROOT = resolve(__dirname, '../..');

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

function externalImports(source: string): string[] {
  const matches = source.matchAll(/from ['"]([^.'"][^'"]*)['"]/g);
  return [...matches].map((match) => packageName(match[1] ?? '')).filter((name) => name !== '');
}

function packageName(specifier: string): string {
  if (specifier.startsWith('node:')) return '';
  if (specifier.startsWith('@')) return specifier.split('/').slice(0, 2).join('/');
  return specifier.split('/')[0] ?? '';
}

describe('webhook manager script dependencies', () => {
  it('does not import undeclared external packages', async () => {
    const [source, packageRaw] = await Promise.all([
      readFile(resolve(PACKAGE_ROOT, 'scripts/webhook-manager.ts'), 'utf-8'),
      readFile(resolve(PACKAGE_ROOT, 'package.json'), 'utf-8'),
    ]);
    const packageJson = JSON.parse(packageRaw) as PackageJson;
    const declared = new Set([
      ...Object.keys(packageJson.dependencies ?? {}),
      ...Object.keys(packageJson.devDependencies ?? {}),
    ]);

    const undeclared = externalImports(source).filter((dependency) => !declared.has(dependency));

    expect(undeclared).toEqual([]);
  });
});
