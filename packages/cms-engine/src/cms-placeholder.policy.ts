import { AppError } from '@tempot/shared';
import type { Result } from '@tempot/shared';
import { err, ok } from 'neverthrow';
import { CMS_ENGINE_ERRORS } from './cms-engine.errors.js';
import type { CmsPlaceholderFinding } from './cms-engine.types.js';

const PLACEHOLDER_PATTERN = /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g;

export function extractCmsPlaceholders(value: string): string[] {
  const names = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = PLACEHOLDER_PATTERN.exec(value)) !== null) {
    names.add(match[1] ?? '');
  }
  return [...names].filter(Boolean).sort();
}

export function compareCmsPlaceholders(source: string, draft: string): CmsPlaceholderFinding[] {
  const required = new Set(extractCmsPlaceholders(source));
  const actual = new Set(extractCmsPlaceholders(draft));
  const findings: CmsPlaceholderFinding[] = [];
  for (const name of required) {
    findings.push({ name, status: actual.has(name) ? 'present' : 'missing' });
  }
  for (const name of actual) {
    if (!required.has(name)) findings.push({ name, status: 'extra' });
  }
  return findings.sort((left, right) => left.name.localeCompare(right.name));
}

export function validateCmsPlaceholders(source: string, draft: string): Result<void> {
  const invalid = compareCmsPlaceholders(source, draft).filter((item) => item.status !== 'present');
  if (invalid.length === 0) return ok(undefined);
  return err(new AppError(CMS_ENGINE_ERRORS.PLACEHOLDER_MISMATCH, { placeholders: invalid }));
}
