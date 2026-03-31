/**
 * spec-validate — Validates spec artifacts against the Tempot monorepo codebase.
 *
 * Usage:
 *   npx tsx scripts/spec-validate/index.ts <spec-dir-name>
 *   npx tsx scripts/spec-validate/index.ts --all
 *
 * Exit codes:
 *   0 — All checks pass
 *   1 — Only HIGH or MEDIUM issues found (warnings)
 *   2 — At least one CRITICAL issue found (blocking)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as process from 'node:process';

import type { PackageReport } from './types.js';
import { SPECS_DIR } from './types.js';
import { stderr } from './file-reader.js';
import {
  checkArtifactExistence,
  checkErrorCodeParity,
  checkFileReferences,
  checkFrCoverage,
  checkNfrBenchmark,
  checkScCoverage,
} from './checks.js';

function validatePackage(specDir: string): PackageReport {
  const checks = [
    checkArtifactExistence(specDir),
    checkFrCoverage(specDir),
    checkScCoverage(specDir),
    checkFileReferences(specDir),
    checkErrorCodeParity(specDir),
    checkNfrBenchmark(specDir),
  ];

  const summary = { critical: 0, high: 0, medium: 0, pass: 0 };
  for (const check of checks) {
    if (check.status === 'PASS') {
      summary.pass++;
    } else {
      const key = check.severity.toLowerCase() as 'critical' | 'high' | 'medium';
      summary[key]++;
    }
  }

  return { package: specDir, timestamp: new Date().toISOString(), summary, checks };
}

function formatHumanReadable(report: PackageReport): string {
  const lines: string[] = [`\n=== ${report.package} ===`];
  for (const check of report.checks) {
    const icon = check.status === 'PASS' ? '\u2713' : '\u2717';
    let line = `  ${icon} ${check.id.padEnd(22)} ${check.status}`;
    if (check.status === 'FAIL') {
      const first = check.details[0];
      const more = check.details.length > 1 ? ` (+${check.details.length - 1} more)` : '';
      line += `  [${check.severity}] ${first.message}${more}`;
    }
    lines.push(line);
  }
  return lines.join('\n') + '\n';
}

function discoverSpecDirs(): string[] {
  if (!fs.existsSync(SPECS_DIR)) return [];
  return fs
    .readdirSync(SPECS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && /^\d{3}-/.test(e.name))
    .map((e) => e.name)
    .sort();
}

function computeExitCode(reports: PackageReport[]): number {
  const hasCritical = reports.some((r) => r.summary.critical > 0);
  if (hasCritical) return 2;
  const hasWarnings = reports.some((r) => r.summary.high > 0 || r.summary.medium > 0);
  if (hasWarnings) return 1;
  return 0;
}

function main(): void {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    stderr('Usage: npx tsx scripts/spec-validate <spec-dir-name>\n');
    stderr('       npx tsx scripts/spec-validate --all\n');
    process.exit(1);
  }

  let specDirs: string[];
  if (args[0] === '--all') {
    specDirs = discoverSpecDirs();
    if (specDirs.length === 0) {
      stderr('No spec directories found in specs/\n');
      process.exit(1);
    }
  } else {
    const specDirPath = path.join(SPECS_DIR, args[0]);
    if (!fs.existsSync(specDirPath) || !fs.statSync(specDirPath).isDirectory()) {
      stderr(`Error: spec directory not found: specs/${args[0]}/\n`);
      process.exit(1);
    }
    specDirs = [args[0]];
  }

  const reports: PackageReport[] = [];
  for (const specDir of specDirs) {
    const report = validatePackage(specDir);
    reports.push(report);
    stderr(formatHumanReadable(report));
  }

  const totalChecks = reports.reduce((a, r) => a + r.checks.length, 0);
  const totalPass = reports.reduce((a, r) => a + r.summary.pass, 0);
  const totalCritical = reports.reduce((a, r) => a + r.summary.critical, 0);
  const totalHigh = reports.reduce((a, r) => a + r.summary.high, 0);
  const totalMedium = reports.reduce((a, r) => a + r.summary.medium, 0);

  stderr(`\n--- Summary: ${totalPass}/${totalChecks} passed`);
  if (totalCritical > 0) stderr(`, ${totalCritical} CRITICAL`);
  if (totalHigh > 0) stderr(`, ${totalHigh} HIGH`);
  if (totalMedium > 0) stderr(`, ${totalMedium} MEDIUM`);
  stderr(' ---\n');

  const jsonOutput = specDirs.length === 1 ? reports[0] : reports;
  process.stdout.write(JSON.stringify(jsonOutput, null, 2) + '\n');
  process.exit(computeExitCode(reports));
}

main();
