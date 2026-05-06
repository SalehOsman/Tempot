import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import type { ModuleDoctorFileContext } from './module-doctor.types.js';

export async function readJsonObject(
  filePath: string,
): Promise<Record<string, unknown> | undefined> {
  try {
    const content = await readFile(filePath, 'utf8');
    const parsed: unknown = JSON.parse(content);

    if (isRecord(parsed)) {
      return parsed;
    }

    return undefined;
  } catch {
    return undefined;
  }
}

export function collectJsonKeys(value: Record<string, unknown>): readonly string[] {
  const keys: string[] = [];
  collectJsonKeysInto(value, '', keys);
  return keys.sort();
}

export async function collectTypeScriptFiles(root: string): Promise<readonly string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(root, entry.name);

    if (entry.isDirectory()) {
      if (!['dist', 'node_modules', 'tests'].includes(entry.name)) {
        files.push(...(await collectTypeScriptFiles(fullPath)));
      }
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.ts')) {
      files.push(fullPath);
    }
  }

  return files;
}

export function collectImportSpecifiers(content: string): readonly string[] {
  const imports: string[] = [];
  const importPattern = /\bfrom\s+['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  let match = importPattern.exec(content);

  while (match !== null) {
    const specifier = match[1] ?? match[2];

    if (specifier !== undefined) {
      imports.push(specifier);
    }

    match = importPattern.exec(content);
  }

  return imports;
}

export function isCrossModuleImport(
  context: ModuleDoctorFileContext,
  filePath: string,
  importSpecifier: string,
): boolean {
  if (
    importSpecifier.startsWith('@tempot/') &&
    importSpecifier !== `@tempot/${context.moduleName}`
  ) {
    return existsSync(join(context.modulesPath, importSpecifier.replace('@tempot/', '')));
  }

  if (!importSpecifier.startsWith('.')) {
    return false;
  }

  const resolvedImport = resolve(dirname(filePath), importSpecifier);
  const relativeToModules = relative(resolve(context.modulesPath), resolvedImport);
  const relativeToCurrentModule = relative(resolve(context.modulePath), resolvedImport);
  const isInsideModules = !relativeToModules.startsWith('..') && !isAbsolute(relativeToModules);
  const isOutsideCurrentModule =
    relativeToCurrentModule.startsWith('..') || isAbsolute(relativeToCurrentModule);

  return isInsideModules && isOutsideCurrentModule;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function collectJsonKeysInto(value: Record<string, unknown>, prefix: string, keys: string[]): void {
  for (const [key, child] of Object.entries(value)) {
    const path = prefix.length > 0 ? `${prefix}.${key}` : key;
    keys.push(path);

    if (isRecord(child)) {
      collectJsonKeysInto(child, path, keys);
    }
  }
}
