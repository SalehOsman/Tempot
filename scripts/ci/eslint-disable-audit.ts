import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Allowlist } from './lib/allowlist-loader.js';
import { loadAllowlist } from './lib/allowlist-loader.js';
import { formatHumanResult, type Violation } from './lib/audit-result.js';
import { runAudit } from './lib/audit-runner.js';
import { scanTypeScriptTokens } from './lib/ts-token-scanner.js';

interface EslintDisableInput {
  repositoryRoot: string;
  allowlist: Allowlist;
  files?: readonly string[];
}

const excludedSegments = new Set(['node_modules', 'dist', 'coverage', '.git']);
const directivePattern = /eslint-disable(?:-next-line|-line)?/;

export function auditEslintDisable(input: EslintDisableInput): Violation[] {
  return collectTypeScriptFiles(input)
    .map((file) => normalizePath(path.relative(input.repositoryRoot, file)))
    .filter((file) => !isTestPath(file))
    .filter((file) => !input.allowlist.isAllowed('eslintDisable', file))
    .flatMap((file) => fileViolations(input.repositoryRoot, file))
    .sort(
      (left, right) =>
        left.file.localeCompare(right.file) ||
        (left.line ?? 0) - (right.line ?? 0) ||
        (left.column ?? 0) - (right.column ?? 0),
    );
}

function fileViolations(repositoryRoot: string, file: string): Violation[] {
  const source = readFileSync(path.join(repositoryRoot, file), 'utf8');
  return scanTypeScriptTokens(source)
    .filter((span) => span.kind === 'lineComment' || span.kind === 'blockComment')
    .flatMap((span) => {
      const comment = source.slice(span.start, span.end);
      const match = directivePattern.exec(comment);
      if (match === null) return [];
      const location = locationForIndex(source, span.start + match.index);
      return [
        {
          rule: 'Rule I',
          file,
          line: location.line,
          column: location.column,
          excerpt: lineAt(source, location.line).trim(),
          message: 'Do not disable ESLint outside tests.',
        },
      ];
    });
}

function collectTypeScriptFiles(input: EslintDisableInput): string[] {
  const files =
    input.files
      ?.map((file) => path.join(input.repositoryRoot, file))
      .filter((file) => existsSync(file)) ??
    ['apps', 'packages', 'modules', 'scripts'].flatMap((segment) =>
      collectFiles(path.join(input.repositoryRoot, segment)),
    );
  return files.filter((file) => file.endsWith('.ts') && !file.endsWith('.d.ts'));
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

function isTestPath(file: string): boolean {
  return /(?:^|\/)(?:tests|__fixtures__)\//.test(file) || /\.test\.ts$|\.spec\.ts$/.test(file);
}

function normalizePath(value: string): string {
  return value.replaceAll(path.sep, '/');
}

function locationForIndex(source: string, index: number): { line: number; column: number } {
  const prefix = source.slice(0, index);
  const lines = prefix.split(/\r?\n/);
  return { line: lines.length, column: (lines.at(-1)?.length ?? 0) + 1 };
}

function lineAt(source: string, line: number): string {
  return source.split(/\r?\n/)[line - 1] ?? '';
}

async function main(): Promise<void> {
  const repositoryRoot = path.resolve(process.cwd());
  const allowlist = loadAllowlist({
    repositoryRoot,
    allowlistPath: path.join(repositoryRoot, 'scripts', 'ci', 'methodology-lint.allowlist.json'),
  });
  const run = await runAudit('eslint-disable', () =>
    auditEslintDisable({ repositoryRoot, allowlist }),
  );
  process.stdout.write(formatHumanResult(run.result));
  process.exitCode = run.exitCode;
}

const entryPoint = process.argv[1];
if (entryPoint && import.meta.url === pathToFileURL(entryPoint).href) {
  await main();
}
