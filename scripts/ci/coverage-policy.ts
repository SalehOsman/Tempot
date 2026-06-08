import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export type CoverageCategory = 'service' | 'handler' | 'repository' | 'conversation';
export type CoverageSeverity = 'fail' | 'warn';

interface CoverageMetric {
  total: number;
  covered: number;
  skipped: number;
  pct: number;
}

interface FileCoverageSummary {
  lines: CoverageMetric;
  functions: CoverageMetric;
  statements: CoverageMetric;
  branches: CoverageMetric;
}

export type CoverageSummary = Record<string, FileCoverageSummary>;

export interface CoverageFinding {
  file: string;
  category: CoverageCategory;
  severity: CoverageSeverity;
  threshold: number;
  actual: number;
}

export interface CoveragePolicyReport {
  evaluatedFiles: string[];
  failures: CoverageFinding[];
  warnings: CoverageFinding[];
}

interface CoverageRule {
  category: CoverageCategory;
  threshold: number;
  severity: CoverageSeverity;
  pattern: RegExp;
}

const COVERAGE_RULES: CoverageRule[] = [
  {
    category: 'service',
    threshold: 80,
    severity: 'fail',
    pattern: /(?:^|[/.-])services?(?:[/.-]|$)/i,
  },
  {
    category: 'handler',
    threshold: 70,
    severity: 'fail',
    pattern: /(?:^|[/.-])handlers?(?:[/.-]|$)/i,
  },
  {
    category: 'repository',
    threshold: 60,
    severity: 'warn',
    pattern: /(?:^|[/.-])(?:repository|repositories)(?:[/.-]|$)/i,
  },
  {
    category: 'conversation',
    threshold: 50,
    severity: 'warn',
    pattern: /(?:^|[/.-])conversations?(?:[/.-]|$)/i,
  },
];

export function evaluateCoveragePolicy(summary: CoverageSummary): CoveragePolicyReport {
  const entries = Object.entries(summary).filter(([file]) => file !== 'total');
  const evaluatedFiles: string[] = [];
  const failures: CoverageFinding[] = [];
  const warnings: CoverageFinding[] = [];

  for (const rule of COVERAGE_RULES) {
    for (const [file, coverage] of entries) {
      const normalizedFile = file.replaceAll('\\', '/');
      if (!rule.pattern.test(normalizedFile)) continue;

      evaluatedFiles.push(normalizedFile);
      if (coverage.lines.pct >= rule.threshold) continue;

      const finding: CoverageFinding = {
        file: normalizedFile,
        category: rule.category,
        severity: rule.severity,
        threshold: rule.threshold,
        actual: coverage.lines.pct,
      };

      if (rule.severity === 'fail') failures.push(finding);
      else warnings.push(finding);
    }
  }

  return {
    evaluatedFiles: [...new Set(evaluatedFiles)],
    failures,
    warnings,
  };
}

async function main(): Promise<void> {
  const summaryPath = path.resolve(process.argv[2] ?? 'coverage/coverage-summary.json');
  const summary = JSON.parse(await readFile(summaryPath, 'utf8')) as CoverageSummary;
  const report = evaluateCoveragePolicy(summary);

  for (const warning of report.warnings) {
    process.stderr.write(
      `Coverage warning: ${warning.file} (${warning.category}) lines=${warning.actual}% threshold=${warning.threshold}%\n`,
    );
  }
  for (const failure of report.failures) {
    process.stderr.write(
      `Coverage failure: ${failure.file} (${failure.category}) lines=${failure.actual}% threshold=${failure.threshold}%\n`,
    );
  }

  process.stdout.write(
    `Coverage policy: evaluated=${report.evaluatedFiles.length} failures=${report.failures.length} warnings=${report.warnings.length}\n`,
  );
  if (report.failures.length > 0) process.exitCode = 1;
}

const entryPoint = process.argv[1];
if (entryPoint && import.meta.url === pathToFileURL(entryPoint).href) {
  await main();
}
