import { Result, ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { generateSchemaFromSource } from '../src/i18n.schema.js';

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
  // URLs and paths
  /^https?:\/\//,
  /^\.{0,2}\//,
  // Single words that are identifiers (camelCase, UPPER_CASE, snake_case, kebab-case)
  /^[a-zA-Z_$][a-zA-Z0-9_$]*$/,
  /^[A-Z][A-Z0-9_]+$/,
  /^[a-z]+(-[a-z]+)+$/,
  // Dotted identifiers (e.g. 'common.greeting', 'I18N_LOCALE_LOAD_FAILED')
  /^[a-zA-Z_][a-zA-Z0-9_.]*$/,
  // Regex-like patterns
  /^\^.*\$$/,
  // Empty or whitespace-only strings
  /^\s*$/,
  // Single character strings
  /^.$/,
  // Numeric strings
  /^\d+(\.\d+)?$/,
  // Template literal expressions (just the variable)
  /^\$\{.*\}$/,
];

/**
 * Arabic Unicode range detection.
 * Matches strings containing Arabic script characters.
 */
const ARABIC_PATTERN = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

/**
 * Detects human-readable strings that look like sentences or phrases.
 * A string is considered "human-readable" if it:
 * - Contains Arabic characters, OR
 * - Contains multiple words with spaces and starts with a capital letter, OR
 * - Contains multiple words with spaces (likely a phrase/sentence)
 */
const HUMAN_READABLE_PATTERN = /^[A-Z][a-z].*\s\w|^\w+\s\w+\s\w+/;

/**
 * Checks if a string value appears to be hardcoded human-readable text
 * rather than a technical identifier.
 */
function isHardcodedHumanString(value: string): boolean {
  // Skip technical patterns
  for (const pattern of TECHNICAL_PATTERNS) {
    if (pattern.test(value)) {
      return false;
    }
  }

  // Flag Arabic text
  if (ARABIC_PATTERN.test(value)) {
    return true;
  }

  // Flag English sentences/phrases (multiple words)
  if (HUMAN_READABLE_PATTERN.test(value)) {
    return true;
  }

  return false;
}

/**
 * Scans source code text for hardcoded human-readable strings.
 *
 * This performs a simplified AST-like analysis by extracting string literals
 * from the source and checking if they appear to be human-readable text.
 *
 * @param source - The source code content to scan
 * @param filePath - The file path (used for reporting and filtering)
 * @returns Array of violations found
 */
export function detectHardcodedStrings(source: string, filePath: string): CmsCheckViolation[] {
  // Skip locale JSON files — they're supposed to contain translated strings
  if (/locales\/[a-z]{2}\.json$/i.test(filePath)) {
    return [];
  }

  // Skip non-source files
  if (!/\.(ts|tsx|js|jsx)$/.test(filePath)) {
    return [];
  }

  const violations: CmsCheckViolation[] = [];
  const lines = source.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;

    // Skip import/require lines
    if (/^\s*(import\s|.*require\s*\()/.test(line)) {
      continue;
    }

    // Skip lines that are comments
    if (/^\s*(\/\/|\/\*|\*)/.test(line)) {
      continue;
    }

    // Extract string literals (both single and double quoted)
    const stringLiterals = line.match(/(?<!=\s*t\s*\()(['"])(?:(?!\1).)+\1/g);
    if (!stringLiterals) {
      continue;
    }

    for (const literal of stringLiterals) {
      // Remove quotes
      const value = literal.slice(1, -1);

      // Check if it's inside a t() call on the same line
      const tCallPattern = new RegExp(
        `t\\s*\\(\\s*${literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
      );
      if (tCallPattern.test(line)) {
        continue;
      }

      if (isHardcodedHumanString(value)) {
        violations.push({
          file: filePath,
          line: lineNumber,
          type: 'hardcoded-string',
          message: `Hardcoded string detected: "${value.substring(0, 50)}${value.length > 50 ? '...' : ''}"`,
        });
      }
    }
  }

  return violations;
}

/**
 * Validates that a target locale file has the same key structure as the source.
 * Uses `generateSchemaFromSource` from the schema module to build a strict
 * Zod schema from the source (ar.json) and validate the target against it.
 *
 * @param source - The source locale data (ar.json — source of truth)
 * @param target - The target locale data to validate (e.g. en.json)
 * @param targetPath - File path for error reporting
 * @returns Result indicating success or failure with AppError
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
      'I18N_LOCALE_PARITY_FAILED',
      `Locale parity check failed for ${targetPath}: ${issues}`,
    ),
  );
}
