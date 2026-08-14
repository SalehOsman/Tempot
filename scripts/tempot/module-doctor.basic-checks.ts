import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import type { ModuleDoctorCheck, ModuleDoctorFileContext } from './module-doctor.types.js';
import {
  collectImportSpecifiers,
  collectJsonKeys,
  collectTypeScriptFiles,
  isCrossModuleImport,
  isRecord,
  readJsonObject,
} from './module-doctor.readers.js';

const REQUIRED_FILES = [
  'package.json',
  'module.config.ts',
  'module.manifest.ts',
  'locales/ar.json',
  'locales/en.json',
] as const;

export function checkModuleDirectory(context: ModuleDoctorFileContext): ModuleDoctorCheck {
  const exists = existsSync(context.modulePath);

  return {
    name: 'Module directory',
    status: exists ? 'pass' : 'fail',
    summary: exists
      ? `Module directory found: modules/${context.moduleName}`
      : `Module directory not found: modules/${context.moduleName}`,
    suggestion: exists
      ? 'No action needed.'
      : `Create the module first with pnpm tempot module create ${context.moduleName}.`,
    blocking: true,
  };
}

export function checkRequiredFiles(context: ModuleDoctorFileContext): ModuleDoctorCheck {
  const missingFiles = REQUIRED_FILES.filter((file) => !existsSync(join(context.modulePath, file)));

  return {
    name: 'Required files',
    status: missingFiles.length === 0 ? 'pass' : 'fail',
    summary:
      missingFiles.length === 0
        ? 'Required module files are present.'
        : `Missing required files: ${missingFiles.join(', ')}`,
    suggestion:
      missingFiles.length === 0
        ? 'No action needed.'
        : 'Add the missing module metadata and locale files.',
    blocking: true,
  };
}

export async function checkPackageMetadata(
  context: ModuleDoctorFileContext,
): Promise<ModuleDoctorCheck> {
  const packageJson = await readJsonObject(join(context.modulePath, 'package.json'));
  const missingFields: string[] = [];

  if (packageJson === undefined) return missingPackageMetadataCheck();

  if (typeof packageJson['main'] !== 'string') missingFields.push('main');
  if (typeof packageJson['types'] !== 'string') missingFields.push('types');
  if (!hasRootExport(packageJson)) missingFields.push('exports["."]');
  if (!hasScript(packageJson, 'build')) missingFields.push('scripts.build');
  if (!hasScript(packageJson, 'test')) missingFields.push('scripts.test');

  return {
    name: 'Package metadata',
    status: missingFields.length === 0 ? 'pass' : 'fail',
    summary:
      missingFields.length === 0
        ? 'Package metadata includes required entrypoints and scripts.'
        : `Missing package metadata: ${missingFields.join(', ')}`,
    suggestion:
      missingFields.length === 0
        ? 'No action needed.'
        : 'Align package.json with the Tempot module package checklist.',
    blocking: true,
  };
}

export async function checkLocaleParity(
  context: ModuleDoctorFileContext,
): Promise<ModuleDoctorCheck> {
  const ar = await readJsonObject(join(context.modulePath, 'locales', 'ar.json'));
  const en = await readJsonObject(join(context.modulePath, 'locales', 'en.json'));

  if (ar === undefined || en === undefined) return missingLocaleCheck();

  const drift = localeDrift(collectJsonKeys(ar), collectJsonKeys(en));

  return {
    name: 'Locale parity',
    status: drift.length === 0 ? 'pass' : 'fail',
    summary:
      drift.length === 0
        ? 'Arabic and English locale keys are aligned.'
        : `Locale key drift found: ${drift.join(', ')}`,
    suggestion:
      drift.length === 0 ? 'No action needed.' : 'Add matching keys to both locale files.',
    blocking: true,
  };
}

export async function checkModuleImports(
  context: ModuleDoctorFileContext,
): Promise<ModuleDoctorCheck> {
  const sourceFiles = await collectTypeScriptFiles(context.modulePath);
  const violations: string[] = [];

  for (const filePath of sourceFiles) {
    const content = await readFile(filePath, 'utf8');
    const imports = collectImportSpecifiers(content);

    for (const importSpecifier of imports) {
      if (isCrossModuleImport(context, filePath, importSpecifier)) {
        violations.push(`${relative(context.modulePath, filePath)} -> ${importSpecifier}`);
      }
    }
  }

  return {
    name: 'Module imports',
    status: violations.length === 0 ? 'pass' : 'fail',
    summary:
      violations.length === 0
        ? 'No direct imports from another module were found.'
        : `Direct module imports found: ${violations.join(', ')}`,
    suggestion:
      violations.length === 0
        ? 'No action needed.'
        : 'Communicate across modules through events or approved packages.',
    blocking: true,
  };
}

function missingPackageMetadataCheck(): ModuleDoctorCheck {
  return {
    name: 'Package metadata',
    status: 'fail',
    summary: 'package.json is missing or invalid.',
    suggestion: 'Create a valid package.json with main, types, exports, build, and test.',
    blocking: true,
  };
}

function missingLocaleCheck(): ModuleDoctorCheck {
  return {
    name: 'Locale parity',
    status: 'fail',
    summary: 'Locale files are missing or invalid.',
    suggestion: 'Create valid locales/ar.json and locales/en.json files.',
    blocking: true,
  };
}

function localeDrift(arKeys: readonly string[], enKeys: readonly string[]): readonly string[] {
  const missingInAr = enKeys.filter((key) => !arKeys.includes(key));
  const missingInEn = arKeys.filter((key) => !enKeys.includes(key));
  return [...missingInAr.map((key) => `ar:${key}`), ...missingInEn.map((key) => `en:${key}`)];
}

function hasRootExport(packageJson: Record<string, unknown>): boolean {
  const exportsValue = packageJson['exports'];

  if (!isRecord(exportsValue)) return false;

  return exportsValue['.'] !== undefined;
}

function hasScript(packageJson: Record<string, unknown>, scriptName: string): boolean {
  const scripts = packageJson['scripts'];

  if (!isRecord(scripts)) return false;

  return typeof scripts[scriptName] === 'string';
}
