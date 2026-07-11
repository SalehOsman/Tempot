export interface Violation {
  rule: string;
  file: string;
  line?: number;
  column?: number;
  excerpt?: string;
  message: string;
}

export interface AuditResult {
  audit: string;
  passed: boolean;
  violations: Violation[];
  durationMs: number;
}

export function sortViolations(violations: readonly Violation[]): Violation[] {
  return [...violations].sort(
    (left, right) =>
      left.file.localeCompare(right.file) ||
      (left.line ?? 0) - (right.line ?? 0) ||
      (left.column ?? 0) - (right.column ?? 0) ||
      left.rule.localeCompare(right.rule),
  );
}

export function formatLocation(violation: Violation): string {
  const line = violation.line ?? 1;
  const column = violation.column ?? 1;
  return `${violation.file}:${line}:${column}`;
}

export function formatHumanResult(result: AuditResult): string {
  if (result.passed) return `[${result.audit}] PASS  (${result.durationMs} ms)\n`;

  const lines = sortViolations(result.violations).flatMap((violation) => [
    `[${result.audit}] ${violation.rule}  ${formatLocation(violation)}  ${violation.message}`,
    ...(violation.excerpt ? [`    ↳ ${violation.excerpt}`] : []),
  ]);
  lines.push(
    `[${result.audit}] FAIL  (${result.violations.length} violation(s) in ${result.durationMs} ms)`,
  );
  return `${lines.join('\n')}\n`;
}
