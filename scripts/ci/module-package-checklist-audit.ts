import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export type ModuleChecklistViolationCode =
  | 'MISSING_TYPES'
  | 'MISSING_EXPORTS'
  | 'MISSING_VITEST_CONFIG'
  | 'MISSING_GITIGNORE';

export interface ModuleChecklistInput {
  moduleName: string;
  files: Set<string>;
  packageJson: Record<string, unknown>;
}

export interface ModuleChecklistViolation {
  code: ModuleChecklistViolationCode;
  moduleName: string;
  message: string;
}

export interface ModuleChecklistReport {
  checkedModules: number;
  violations: ModuleChecklistViolation[];
}

export function auditModulePackageChecklist(
  modules: ModuleChecklistInput[],
): ModuleChecklistReport {
  const violations = modules.flatMap((moduleInput) => [
    ...checkPackageMetadata(moduleInput),
    ...checkGovernanceFiles(moduleInput),
  ]);

  return {
    checkedModules: modules.length,
    violations,
  };
}

export function collectModuleChecklistInputs(cwd: string): ModuleChecklistInput[] {
  const modulesRoot = join(cwd, 'modules');
  return readdirSync(modulesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => readModuleChecklistInput(modulesRoot, entry.name));
}

export function renderModuleChecklistReport(report: ModuleChecklistReport): string {
  const lines = [
    `Module package checklist checked ${report.checkedModules} modules.`,
    `Violations: ${report.violations.length}`,
  ];

  for (const violation of report.violations) {
    lines.push(`${violation.code}: modules/${violation.moduleName}`);
  }

  return `${lines.join('\n')}\n`;
}

function readModuleChecklistInput(modulesRoot: string, moduleName: string): ModuleChecklistInput {
  const moduleRoot = join(modulesRoot, moduleName);
  const files = new Set(readdirSync(moduleRoot));
  const packageJson = JSON.parse(readFileSync(join(moduleRoot, 'package.json'), 'utf8')) as Record<
    string,
    unknown
  >;

  return {
    moduleName,
    files,
    packageJson,
  };
}

function checkPackageMetadata(input: ModuleChecklistInput): ModuleChecklistViolation[] {
  const violations: ModuleChecklistViolation[] = [];

  if (typeof input.packageJson.types !== 'string') {
    violations.push(createViolation('MISSING_TYPES', input.moduleName));
  }

  if (!hasPublicExport(input.packageJson.exports)) {
    violations.push(createViolation('MISSING_EXPORTS', input.moduleName));
  }

  return violations;
}

function checkGovernanceFiles(input: ModuleChecklistInput): ModuleChecklistViolation[] {
  const violations: ModuleChecklistViolation[] = [];

  if (!input.files.has('vitest.config.ts')) {
    violations.push(createViolation('MISSING_VITEST_CONFIG', input.moduleName));
  }

  if (!input.files.has('.gitignore')) {
    violations.push(createViolation('MISSING_GITIGNORE', input.moduleName));
  }

  return violations;
}

function hasPublicExport(exportsValue: unknown): boolean {
  if (!isRecord(exportsValue)) {
    return false;
  }

  const rootExport = exportsValue['.'];
  if (!isRecord(rootExport)) {
    return false;
  }

  return typeof rootExport.types === 'string' && typeof rootExport.import === 'string';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function createViolation(
  code: ModuleChecklistViolationCode,
  moduleName: string,
): ModuleChecklistViolation {
  return {
    code,
    moduleName,
    message: 'Module package metadata does not satisfy the Tempot package checklist.',
  };
}

if (isCliEntry('module-package-checklist-audit.ts')) {
  const report = auditModulePackageChecklist(collectModuleChecklistInputs(process.cwd()));
  process.stdout.write(renderModuleChecklistReport(report));
  process.exitCode = report.violations.length > 0 ? 1 : 0;
}

function isCliEntry(fileName: string): boolean {
  return process.argv[1]?.replace(/\\/g, '/').endsWith(fileName) ?? false;
}
