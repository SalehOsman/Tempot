import { Result, ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { generateSchemaFromSource } from './i18n.schema.js';

/**
 * Represents a violation found by the cms:check script.
 */
export interface CmsCheckViolation {
  file: string;
  line?: number;
  type: 'hardcoded-string' | 'locale-parity' | 'locale-schema';
  message: string;
}

/**
 * Result of running all cms:check validations.
 */
export interface CmsCheckResult {
  violations: CmsCheckViolation[];
  passed: boolean;
}

/**
 * Regex patterns for strings that are technical / non-human-readable
 * and should NOT be flagged as hardcoded user-facing text.
 */
const TECHNICAL_PATTERNS: RegExp[] = [
  /^https?:\/\//,
  /^\.{0,2}\//,
  /^[a-zA-Z_$][a-zA-Z0-9_$]*$/,
  /^[A-Z][A-Z0-9_]+$/,
  /^[a-z]+(-[a-z]+)+$/,
  /^[a-zA-Z_][a-zA-Z0-9_.]*$/,
  /^\^.*\$$/,
  /^\s*$/,
  /^.$/,
  /^\d+(\.\d+)?$/,
  /^\$\{.*\}$/,
];

/** Arabic Unicode range detection. */
const ARABIC_PATTERN = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

/** Detects human-readable strings (sentences/phrases). */
const HUMAN_READABLE_PATTERN = /^[A-Z][a-z].*\s\w|^\w+\s\w+\s\w+/;

/**
 * Checks if a string value appears to be hardcoded human-readable text
 * rather than a technical identifier.
 */
function isHardcodedHumanString(value: string): boolean {
  for (const pattern of TECHNICAL_PATTERNS) {
    if (pattern.test(value)) return false;
  }
  if (ARABIC_PATTERN.test(value)) return true;
  if (HUMAN_READABLE_PATTERN.test(value)) return true;
  return false;
}

/** Returns true if the file should be skipped by hardcoded string detection. */
function shouldSkipFile(filePath: string): boolean {
  if (/locales\/[a-z]{2}\.json$/i.test(filePath)) return true;
  if (!/\.(ts|tsx|js|jsx)$/.test(filePath)) return true;
  return false;
}

/** Returns true if the line should be skipped (imports, comments). */
function isNonCodeLine(line: string): boolean {
  return /^\s*(import\s|.*require\s*\()/.test(line) || /^\s*(\/\/|\/\*|\*)/.test(line);
}

/** Checks a single line for hardcoded string violations. */
function checkLineForHardcodedStrings(
  line: string,
  lineNumber: number,
  filePath: string,
): CmsCheckViolation[] {
  const stringLiterals = line.match(/(?<!=\s*t\s*\()(['"])(?:(?!\1).)+\1/g);
  if (!stringLiterals) return [];

  const violations: CmsCheckViolation[] = [];
  for (const literal of stringLiterals) {
    const value = literal.slice(1, -1);
    const tCallPattern = new RegExp(
      `t\\s*\\(\\s*${literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
    );
    if (tCallPattern.test(line)) continue;

    if (isHardcodedHumanString(value)) {
      violations.push({
        file: filePath,
        line: lineNumber,
        type: 'hardcoded-string',
        message: `Hardcoded string detected: "${value.substring(0, 50)}${value.length > 50 ? '...' : ''}"`,
      });
    }
  }
  return violations;
}

/**
 * Scans source code text for hardcoded human-readable strings.
 * Performs simplified AST-like analysis by extracting string literals
 * and checking if they appear to be human-readable text.
 */
export function detectHardcodedStrings(source: string, filePath: string): CmsCheckViolation[] {
  if (shouldSkipFile(filePath)) return [];

  const violations: CmsCheckViolation[] = [];
  const lines = source.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (isNonCodeLine(line)) continue;
    violations.push(...checkLineForHardcodedStrings(line, i + 1, filePath));
  }

  return violations;
}

/**
 * Validates that a target locale file has the same key structure as the source.
 * Uses `generateSchemaFromSource` to build a strict Zod schema from the
 * source (ar.json) and validate the target against it.
 */
export function validateLocaleFiles(
  source: Record<string, unknown>,
  target: Record<string, unknown>,
  targetPath: string,
): Result<void, AppError> {
  const schema = generateSchemaFromSource(source);
  const parsed = schema.safeParse(target);

  if (parsed.success) {
    return ok(undefined);
  }

  const issues = parsed.error.issues
    .map((issue) => `${issue.path.map(String).join('.')}: ${issue.message}`)
    .join('; ');

  return err(
    new AppError(
      'i18n.locale_parity_failed',
      `Locale parity check failed for ${targetPath}: ${issues}`,
    ),
  );
}
