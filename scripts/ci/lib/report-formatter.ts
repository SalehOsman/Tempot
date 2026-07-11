import type { AuditResult } from './audit-result.js';

export interface JsonReport {
  version: '1';
  generated_at: string;
  overall: 'pass' | 'fail';
  total_duration_ms: number;
  audits: AuditResult[];
  allowlist: { total: number; expiring_soon: number; expired: number };
}

export function formatJsonReport(report: JsonReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function formatSarifReport(report: JsonReport): string {
  return `${JSON.stringify(
    {
      version: '2.1.0',
      $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
      runs: [
        {
          tool: { driver: { name: 'Tempot methodology lint', rules: [] } },
          results: report.audits.flatMap((audit) =>
            audit.violations.map((violation) => ({
              ruleId: violation.rule,
              message: { text: violation.message },
              locations: [
                {
                  physicalLocation: {
                    artifactLocation: { uri: violation.file },
                    region: { startLine: violation.line ?? 1, startColumn: violation.column ?? 1 },
                  },
                },
              ],
            })),
          ),
        },
      ],
    },
    null,
    2,
  )}\n`;
}
