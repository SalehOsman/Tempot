import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Allowlist } from './lib/allowlist-loader.js';
import { loadAllowlist } from './lib/allowlist-loader.js';
import { formatHumanResult, type Violation } from './lib/audit-result.js';
import { runAudit } from './lib/audit-runner.js';

interface StaleArtifactsInput {
  repositoryRoot: string;
  allowlist: Allowlist;
}

const excludedSegments = new Set(['node_modules', 'dist', 'coverage', '.git']);

export function auditStaleArtifacts(input: StaleArtifactsInput): Violation[] {
  return [...staleJavaScriptFiles(input), ...emptyUtilsDirectories(input)].sort((left, right) =>
    left.file.localeCompare(right.file),
  );
}

function staleJavaScriptFiles(input: StaleArtifactsInput): Violation[] {
  return collectSourceFiles(input.repositoryRoot)
    .map((file) => normalizePath(path.relative(input.repositoryRoot, file)))
    .filter((file) => isStaleJavaScriptPath(file))
    .filter((file) => !input.allowlist.isAllowed('staleArtifacts', file))
    .map((file) => ({
      rule: 'Rule LXXVIII',
      file,
      message: 'Remove stale JavaScript artifact from source tree.',
    }));
}

function emptyUtilsDirectories(input: StaleArtifactsInput): Violation[] {
  return collectModuleDirectories(input.repositoryRoot)
    .map((directory) => normalizePath(path.relative(input.repositoryRoot, directory)))
    .map((directory) => (directory.endsWith('/') ? directory : `${directory}/`))
    .filter((directory) => /^modules\/[^/]+\/utils\/$/.test(directory))
    .filter((directory) => isDirectoryEmpty(path.join(input.repositoryRoot, directory)))
    .filter((directory) => !input.allowlist.isAllowed('staleArtifacts', directory))
    .map((directory) => ({
      rule: 'Rule VIII',
      file: directory,
      message: 'Remove empty utils directory.',
    }));
}

function isStaleJavaScriptPath(file: string): boolean {
  if (!file.endsWith('.js')) return false;
  return /^(apps\/[^/]+\/src|packages\/[^/]+\/src|modules\/[^/]+)\//.test(file);
}

function collectSourceFiles(repositoryRoot: string): string[] {
  return ['apps', 'packages', 'modules'].flatMap((segment) =>
    collectFiles(path.join(repositoryRoot, segment)),
  );
}

function collectModuleDirectories(repositoryRoot: string): string[] {
  return collectDirectories(path.join(repositoryRoot, 'modules'));
}

function collectFiles(root: string): string[] {
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    if (excludedSegments.has(entry.name)) return [];
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) return collectFiles(fullPath);
    return entry.isFile() ? [fullPath] : [];
  });
}

function collectDirectories(root: string): string[] {
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    if (excludedSegments.has(entry.name)) return [];
    const fullPath = path.join(root, entry.name);
    if (!entry.isDirectory()) return [];
    return [fullPath, ...collectDirectories(fullPath)];
  });
}

function isDirectoryEmpty(directory: string): boolean {
  return readdirSync(directory).length === 0;
}

function normalizePath(value: string): string {
  return value.replaceAll(path.sep, '/');
}

async function main(): Promise<void> {
  const repositoryRoot = path.resolve(process.cwd());
  const allowlist = loadAllowlist({
    repositoryRoot,
    allowlistPath: path.join(repositoryRoot, 'scripts', 'ci', 'methodology-lint.allowlist.json'),
  });
  const run = await runAudit('stale-artifacts', () =>
    auditStaleArtifacts({ repositoryRoot, allowlist }),
  );
  process.stdout.write(formatHumanResult(run.result));
  process.exitCode = run.exitCode;
}

const entryPoint = process.argv[1];
if (entryPoint && import.meta.url === pathToFileURL(entryPoint).href) {
  await main();
}
