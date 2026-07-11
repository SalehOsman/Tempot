import { describe, expect, it } from 'vitest';
import { buildMethodologyReport, renderMethodologySummary } from '../../methodology-lint.js';

describe('methodology lint aggregation', () => {
  it('marks the report as failed when any audit has violations', () => {
    const report = buildMethodologyReport({
      generatedAt: '2026-07-11T00:00:00.000Z',
      allowlist: { total: 2, expiringSoon: 1, expired: 0 },
      audits: [
        { audit: 'language-policy', passed: true, violations: [], durationMs: 5 },
        {
          audit: 'stale-artifacts',
          passed: false,
          durationMs: 7,
          violations: [
            {
              rule: 'Rule LXXVIII',
              file: 'apps/demo/src/stale.js',
              message: 'Remove stale JavaScript artifact.',
            },
          ],
        },
      ],
    });

    expect(report.overall).toBe('fail');
    expect(report.total_duration_ms).toBe(12);
    expect(report.allowlist).toEqual({ total: 2, expiring_soon: 1, expired: 0 });
  });

  it('renders a concise human summary', () => {
    const report = buildMethodologyReport({
      generatedAt: '2026-07-11T00:00:00.000Z',
      allowlist: { total: 0, expiringSoon: 0, expired: 0 },
      audits: [{ audit: 'language-policy', passed: true, violations: [], durationMs: 1 }],
    });

    expect(renderMethodologySummary(report)).toContain('Methodology lint: pass');
    expect(renderMethodologySummary(report)).toContain('[language-policy] PASS');
  });
});
