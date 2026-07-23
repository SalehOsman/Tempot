import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { auditEslintDisable } from './eslint-disable-audit.js';
import { auditLanguagePolicy } from './language-policy-audit.js';
import { loadAllowlist, type Allowlist } from './lib/allowlist-loader.js';
import { formatHumanResult, type AuditResult } from './lib/audit-result.js';
import { parseAuditArgs, runAudit } from './lib/audit-runner.js';
import { formatJsonReport, formatSarifReport, type JsonReport } from './lib/report-formatter.js';
import { auditStaleArtifacts } from './stale-artifacts-audit.js';
import { auditTelegramKeyboardUx } from './telegram-keyboard-ux-audit.js';

interface AllowlistSummaryInput {
  total: number;
  expiringSoon: number;
  expired: number;
}

interface BuildReportInput {
  generatedAt: string;
  audits: AuditResult[];
  allowlist: AllowlistSummaryInput;
}

export function buildMethodologyReport(input: BuildReportInput): JsonReport {
  const totalDuration = input.audits.reduce((sum, audit) => sum + audit.durationMs, 0);
  return {
    version: '1',
    generated_at: input.generatedAt,
    overall: input.audits.every((audit) => audit.passed) ? 'pass' : 'fail',
    total_duration_ms: totalDuration,
    audits: input.audits,
    allowlist: {
      total: input.allowlist.total,
      expiring_soon: input.allowlist.expiringSoon,
      expired: input.allowlist.expired,
    },
  };
}

export function renderMethodologySummary(report: JsonReport): string {
  const lines = [
    `Methodology lint: ${report.overall}`,
    `Audits: ${report.audits.length}`,
    `Allowlist: total=${report.allowlist.total} expiring_soon=${report.allowlist.expiring_soon} expired=${report.allowlist.expired}`,
    '',
    ...report.audits.map(formatHumanResult),
  ];
  return lines.join('\n');
}

async function collectAuditResults(
  repositoryRoot: string,
  allowlist: Allowlist,
  files?: readonly string[],
): Promise<AuditResult[]> {
  const allowlistMeta = await runAudit('allowlist-meta', () => allowlist.meta.violations);
  const language = await runAudit('language-policy', () =>
    auditLanguagePolicy({ repositoryRoot, allowlist, files }),
  );
  const stale = await runAudit('stale-artifacts', () =>
    auditStaleArtifacts({ repositoryRoot, allowlist }),
  );
  const eslintDisable = await runAudit('eslint-disable', () =>
    auditEslintDisable({ repositoryRoot, allowlist, files }),
  );
  const telegramKeyboardUx = await runAudit('telegram-keyboard-ux', () =>
    auditTelegramKeyboardUx({ repositoryRoot, files }),
  );

  return [
    allowlistMeta.result,
    language.result,
    stale.result,
    eslintDisable.result,
    telegramKeyboardUx.result,
  ];
}

function summarizeAllowlist(allowlist: Allowlist): AllowlistSummaryInput {
  const total = Object.values(allowlist.entries).reduce((sum, entries) => sum + entries.length, 0);
  const expiringSoon = allowlist.meta.warnings.filter(
    (warning) => warning.message === 'Allowlist entry expires soon.',
  ).length;
  const expired = allowlist.meta.violations.filter(
    (violation) => violation.message === 'Allowlist entry is expired.',
  ).length;
  return { total, expiringSoon, expired };
}

async function main(): Promise<void> {
  const args = parseAuditArgs(process.argv.slice(2));
  const repositoryRoot = path.resolve(process.cwd());
  const allowlist = loadAllowlist({
    repositoryRoot,
    allowlistPath: path.join(repositoryRoot, 'scripts', 'ci', 'methodology-lint.allowlist.json'),
  });
  const files = args.quick ? collectChangedFiles(repositoryRoot) : undefined;
  const audits = await collectAuditResults(repositoryRoot, allowlist, files);
  const report = buildMethodologyReport({
    generatedAt: new Date().toISOString(),
    audits,
    allowlist: summarizeAllowlist(allowlist),
  });

  if (!args.silent) {
    if (args.format === 'json') process.stdout.write(formatJsonReport(report));
    else if (args.format === 'sarif') process.stdout.write(formatSarifReport(report));
    else process.stdout.write(renderMethodologySummary(report));
  }

  process.exitCode = report.overall === 'pass' ? 0 : 1;
}

const entryPoint = process.argv[1];
if (entryPoint && import.meta.url === pathToFileURL(entryPoint).href) {
  await main();
}

function collectChangedFiles(repositoryRoot: string): string[] {
  const staged = readGitFiles(repositoryRoot, [
    'diff',
    '--name-only',
    '--cached',
    '--diff-filter=ACMR',
  ]);
  if (staged.length > 0) return staged;
  return readGitFiles(repositoryRoot, ['diff', '--name-only', '--diff-filter=ACMR']);
}

function readGitFiles(repositoryRoot: string, args: readonly string[]): string[] {
  try {
    return execFileSync('git', [...args], { cwd: repositoryRoot, encoding: 'utf8' })
      .split(/\r?\n/)
      .map((file) => file.trim().replaceAll('\\', '/'))
      .filter(Boolean);
  } catch {
    return [];
  }
}
