import { describe, expect, it } from 'vitest';
import { formatJsonReport, formatSarifReport } from '../../lib/report-formatter.js';

const report = {
  version: '1' as const,
  generated_at: '2026-07-11T00:00:00.000Z',
  overall: 'fail' as const,
  total_duration_ms: 5,
  allowlist: { total: 1, expiring_soon: 0, expired: 0 },
  audits: [
    {
      audit: 'eslint-disable',
      passed: false,
      durationMs: 5,
      violations: [
        {
          rule: 'Rule I',
          file: 'scripts/example.ts',
          line: 1,
          column: 1,
          message: 'Do not disable ESLint.',
        },
      ],
    },
  ],
};

describe('report formatters', () => {
  it('formats stable JSON output', () => {
    expect(JSON.parse(formatJsonReport(report))).toEqual(report);
  });

  it('formats SARIF output with audit rules', () => {
    const sarif = JSON.parse(formatSarifReport(report));

    expect(sarif.version).toBe('2.1.0');
    expect(sarif.runs[0].results[0].ruleId).toBe('Rule I');
  });
});
