import type { AuditResult, Violation } from './audit-result.js';

export type AuditFormat = 'human' | 'json' | 'sarif';

export interface AuditArgs {
  format: AuditFormat;
  fixtureRoot?: string;
  quick: boolean;
  silent: boolean;
}

export interface RunAuditResult {
  result: AuditResult;
  exitCode: 0 | 1;
}

export function parseAuditArgs(args: readonly string[]): AuditArgs {
  const parsed: AuditArgs = { format: 'human', quick: false, silent: false };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg.startsWith('--format=')) parsed.format = parseFormat(arg.slice('--format='.length));
    if (arg === '--fixture-root') parsed.fixtureRoot = args[index + 1];
    if (arg === '--quick') parsed.quick = true;
    if (arg === '--silent') parsed.silent = true;
  }

  return parsed;
}

export async function runAudit(
  audit: string,
  collectViolations: () => Promise<Violation[]> | Violation[],
): Promise<RunAuditResult> {
  const start = Date.now();
  const violations = await collectViolations();
  const result: AuditResult = {
    audit,
    passed: violations.length === 0,
    violations,
    durationMs: Date.now() - start,
  };

  return { result, exitCode: result.passed ? 0 : 1 };
}

function parseFormat(value: string): AuditFormat {
  if (value === 'json' || value === 'sarif') return value;
  return 'human';
}
