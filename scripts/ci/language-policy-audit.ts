import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Allowlist } from './lib/allowlist-loader.js';
import { loadAllowlist } from './lib/allowlist-loader.js';
import { formatHumanResult, type Violation } from './lib/audit-result.js';
import { runAudit } from './lib/audit-runner.js';
import { scanTypeScriptTokens, type TypeScriptTokenSpan } from './lib/ts-token-scanner.js';

interface LanguagePolicyInput {
  repositoryRoot: string;
  allowlist: Allowlist;
  files?: readonly string[];
}

interface TypeScriptMatchContext {
  source: string;
  spans: readonly TypeScriptTokenSpan[];
  isTest: boolean;
}

interface ViolationInput {
  file: string;
  source: string;
  index: number;
  message: string;
}

const arabicPattern = /[\u0600-\u06ff]/gu;
const excludedSegments = new Set(['node_modules', 'dist', 'coverage', '.git', 'locales']);

export function auditLanguagePolicy(input: LanguagePolicyInput): Violation[] {
  return collectCandidateFiles(input)
    .flatMap((file) => auditFile(input.repositoryRoot, file, input.allowlist))
    .sort(
      (left, right) =>
        left.file.localeCompare(right.file) ||
        (left.line ?? 0) - (right.line ?? 0) ||
        (left.column ?? 0) - (right.column ?? 0),
    );
}

function auditFile(repositoryRoot: string, file: string, allowlist: Allowlist): Violation[] {
  const relative = normalizePath(path.relative(repositoryRoot, file));
  if (allowlist.isAllowed('languagePolicy', relative)) return [];

  const source = readFileSync(file, 'utf8');
  if (relative.endsWith('.md')) return markdownViolations(relative, source);
  if (relative.endsWith('.ts')) return typeScriptViolations(relative, source);
  return [];
}

function markdownViolations(file: string, source: string): Violation[] {
  return arabicLineMatches(source).map((match) =>
    violation({ file, source, index: match.index, message: 'Use English.' }),
  );
}

function typeScriptViolations(file: string, source: string): Violation[] {
  const spans = scanTypeScriptTokens(source);
  const isTest =
    /(?:^|\/)(?:tests|__fixtures__)\//.test(file) || /\.test\.ts$|\.spec\.ts$/.test(file);
  const context = { source, spans, isTest };

  return arabicLineMatches(source)
    .filter((match) => isViolationInTypeScript(context, match.index))
    .map((match) =>
      violation({
        file,
        source,
        index: match.index,
        message: 'Use English developer-facing text.',
      }),
    );
}

function isViolationInTypeScript(context: TypeScriptMatchContext, index: number): boolean {
  const span = context.spans.find((candidate) => index >= candidate.start && index < candidate.end);
  if (span === undefined) return true;
  if (span.kind === 'lineComment' || span.kind === 'blockComment') return true;
  if (context.isTest && (span.kind === 'string' || span.kind === 'template')) return false;
  return context.source.slice(span.start, span.end).includes(context.source[index]);
}

function violation(input: ViolationInput): Violation {
  const location = locationForIndex(input.source, input.index);
  return {
    rule: 'Rule XL',
    file: input.file,
    line: location.line,
    column: location.column,
    excerpt: lineAt(input.source, location.line).trim().slice(0, 120),
    message: input.message,
  };
}

function arabicLineMatches(source: string): { index: number }[] {
  const seenLines = new Set<number>();
  const matches: { index: number }[] = [];
  for (const match of source.matchAll(arabicPattern)) {
    const index = match.index ?? 0;
    const line = locationForIndex(source, index).line;
    if (seenLines.has(line)) continue;
    seenLines.add(line);
    matches.push({ index });
  }
  return matches;
}

function collectCandidateFiles(input: LanguagePolicyInput): string[] {
  const files =
    input.files
      ?.map((file) => path.join(input.repositoryRoot, file))
      .filter((file) => existsSync(file)) ?? collectFiles(input.repositoryRoot);
  return files.filter(
    (file) => file.endsWith('.md') || (file.endsWith('.ts') && !file.endsWith('.d.ts')),
  );
}

function collectFiles(root: string): string[] {
  const files: string[] = [];
  for (const name of readdirSync(root)) {
    if (excludedSegments.has(name)) continue;
    const fullPath = path.join(root, name);
    const stats = lstatSync(fullPath);
    if (stats.isSymbolicLink()) continue;
    if (stats.isDirectory()) files.push(...collectFiles(fullPath));
    if (stats.isFile()) files.push(fullPath);
  }
  return files;
}

function locationForIndex(source: string, index: number): { line: number; column: number } {
  const prefix = source.slice(0, index);
  const lines = prefix.split(/\r?\n/);
  return { line: lines.length, column: (lines.at(-1)?.length ?? 0) + 1 };
}

function lineAt(source: string, line: number): string {
  return source.split(/\r?\n/)[line - 1] ?? '';
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
  const run = await runAudit('language-policy', () =>
    auditLanguagePolicy({ repositoryRoot, allowlist }),
  );
  process.stdout.write(formatHumanResult(run.result));
  process.exitCode = run.exitCode;
}

const entryPoint = process.argv[1];
if (entryPoint && import.meta.url === pathToFileURL(entryPoint).href) {
  await main();
}
