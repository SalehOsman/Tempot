import { describe, expect, it } from 'vitest';
import {
  formatHumanResult,
  sortViolations,
  type AuditResult,
  type Violation,
} from '../../lib/audit-result.js';

describe('audit result helpers', () => {
  it('sorts violations by file, line, column, then rule', () => {
    const violations: Violation[] = [
      { rule: 'Rule XL', file: 'b.ts', line: 1, column: 1, message: 'b' },
      { rule: 'Rule I', file: 'a.ts', line: 2, column: 1, message: 'a2' },
      { rule: 'Rule I', file: 'a.ts', line: 1, column: 4, message: 'a1' },
    ];

    expect(sortViolations(violations).map((violation) => violation.message)).toEqual([
      'a1',
      'a2',
      'b',
    ]);
  });

  it('formats pass and fail output deterministically', () => {
    const result: AuditResult = {
      audit: 'language-policy',
      passed: false,
      violations: [
        {
          rule: 'Rule XL',
          file: 'docs/example.md',
          line: 3,
          column: 5,
          excerpt: 'Arabic prose',
          message: 'Use English developer-facing prose.',
        },
      ],
      durationMs: 12,
    };

    expect(formatHumanResult(result)).toContain(
      '[language-policy] Rule XL  docs/example.md:3:5  Use English developer-facing prose.',
    );
    expect(formatHumanResult({ ...result, passed: true, violations: [] })).toBe(
      '[language-policy] PASS  (12 ms)\n',
    );
  });
});
