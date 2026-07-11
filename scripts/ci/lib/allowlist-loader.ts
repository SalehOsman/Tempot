import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { Violation } from './audit-result.js';

export type AllowlistCategory = 'languagePolicy' | 'staleArtifacts' | 'eslintDisable';

export interface AllowlistEntry {
  pattern: string;
  reason: string;
  added_at: string;
  expires_at: string;
  owner_spec: string;
}

export interface Allowlist {
  meta: { violations: Violation[]; warnings: Violation[] };
  entries: Record<AllowlistCategory, AllowlistEntry[]>;
  isAllowed: (category: AllowlistCategory, file: string) => boolean;
}

interface LoadAllowlistInput {
  repositoryRoot: string;
  allowlistPath: string;
  today?: string;
}

const categories: AllowlistCategory[] = ['languagePolicy', 'staleArtifacts', 'eslintDisable'];

interface ValidationContext {
  repositoryRoot: string;
  repositoryPaths: readonly string[];
  today: Date;
  violations: Violation[];
  warnings: Violation[];
}

export function loadAllowlist(input: LoadAllowlistInput): Allowlist {
  const parsed = JSON.parse(readFileSync(input.allowlistPath, 'utf8')) as Record<string, unknown>;
  const entries = readEntries(parsed);
  const today = new Date(`${input.today ?? new Date().toISOString().slice(0, 10)}T00:00:00.000Z`);
  const meta = validateEntries(input.repositoryRoot, entries, today);

  return {
    meta,
    entries,
    isAllowed: (category, file) =>
      entries[category].some((entry) => matchesPattern(entry.pattern, normalizePath(file))),
  };
}

function readEntries(parsed: Record<string, unknown>): Record<AllowlistCategory, AllowlistEntry[]> {
  return Object.fromEntries(
    categories.map((category) => {
      const section = parsed[category] as { entries?: unknown[] } | undefined;
      return [category, (section?.entries ?? []) as AllowlistEntry[]];
    }),
  ) as Record<AllowlistCategory, AllowlistEntry[]>;
}

function validateEntries(
  repositoryRoot: string,
  entries: Record<AllowlistCategory, AllowlistEntry[]>,
  today: Date,
) {
  const violations: Violation[] = [];
  const warnings: Violation[] = [];
  const repositoryPaths = collectPaths(repositoryRoot);

  for (const [category, categoryEntries] of Object.entries(entries)) {
    for (const entry of categoryEntries) {
      const file = `${category}:${entry.pattern}`;
      const context = { repositoryRoot, repositoryPaths, today, violations, warnings };
      validateEntryShape(entry, file, context);
      validateEntryDate(entry, file, context);
    }
  }

  return { violations, warnings };
}

function validateEntryShape(entry: AllowlistEntry, file: string, context: ValidationContext): void {
  if (
    !entry.pattern ||
    !entry.reason ||
    !entry.added_at ||
    !entry.expires_at ||
    !entry.owner_spec
  ) {
    context.violations.push({
      rule: 'allowlist-meta',
      file,
      message: 'Allowlist entry is missing a field.',
    });
  }
  if (entry.reason.length < 20) {
    context.violations.push({
      rule: 'allowlist-meta',
      file,
      message: 'Allowlist reason is too short.',
    });
  }
  if (!patternHasMatch(context.repositoryPaths, entry.pattern)) {
    context.violations.push({
      rule: 'allowlist-meta',
      file,
      message: 'Allowlist pattern does not match any file.',
    });
  }
  if (!existsSync(path.join(context.repositoryRoot, 'specs', entry.owner_spec))) {
    context.violations.push({
      rule: 'allowlist-meta',
      file,
      message: 'Allowlist owner spec is missing.',
    });
  }
}

function validateEntryDate(entry: AllowlistEntry, file: string, context: ValidationContext): void {
  const addedAt = parseDate(entry.added_at);
  const expiresAt = parseDate(entry.expires_at);
  if (addedAt === null || expiresAt === null) {
    context.violations.push({
      rule: 'allowlist-meta',
      file,
      message: 'Allowlist date is invalid.',
    });
    return;
  }
  if (expiresAt.getTime() > addedAt.getTime() + 90 * 86_400_000) {
    context.violations.push({
      rule: 'allowlist-meta',
      file,
      message: 'Allowlist expiry exceeds 90 days.',
    });
  }
  const daysLeft = Math.floor((expiresAt.getTime() - context.today.getTime()) / 86_400_000);
  if (daysLeft < 0) {
    context.violations.push({
      rule: 'allowlist-meta',
      file,
      message: 'Allowlist entry is expired.',
    });
  } else if (daysLeft <= 14) {
    context.warnings.push({
      rule: 'allowlist-meta',
      file,
      message: 'Allowlist entry expires soon.',
    });
  }
}

function parseDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return new Date(`${value}T00:00:00.000Z`);
}

function patternHasMatch(repositoryPaths: readonly string[], pattern: string): boolean {
  return repositoryPaths.some((file) => matchesPattern(pattern, file));
}

function collectPaths(root: string): string[] {
  const entries: string[] = [];
  for (const name of readdirSync(root)) {
    if (name === 'node_modules' || name === '.git' || name === 'dist') continue;
    const fullPath = path.join(root, name);
    const relative = normalizePath(path.relative(root, fullPath));
    const stats = lstatSync(fullPath);
    if (stats.isSymbolicLink()) {
      entries.push(relative);
    } else if (stats.isDirectory()) {
      entries.push(
        `${relative}/`,
        ...collectPaths(fullPath).map((child) => `${relative}/${child}`),
      );
    } else {
      entries.push(relative);
    }
  }
  return entries;
}

function matchesPattern(pattern: string, file: string): boolean {
  if (pattern.endsWith('/**')) return file.startsWith(pattern.slice(0, -3));
  if (pattern.endsWith('/')) return file === pattern || file.startsWith(pattern);
  return file === pattern;
}

function normalizePath(value: string): string {
  return value.replaceAll(path.sep, '/');
}
