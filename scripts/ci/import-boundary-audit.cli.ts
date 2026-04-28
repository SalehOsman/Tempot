import { auditImportBoundaries, type ImportBoundaryReport } from './import-boundary-audit.js';
import { collectTrackedSourceFiles } from './tracked-source-files.js';

function renderImportBoundaryReport(report: ImportBoundaryReport): string {
  const lines = [
    `Tracked import audit checked ${report.checkedFiles} TypeScript files.`,
    `Violations: ${report.violations.length}`,
  ];

  for (const violation of report.violations) {
    lines.push(`${violation.code}: ${violation.importer} -> ${violation.specifier}`);
  }

  return `${lines.join('\n')}\n`;
}

const report = auditImportBoundaries(collectTrackedSourceFiles(process.cwd()));
process.stdout.write(renderImportBoundaryReport(report));
process.exitCode = report.violations.length > 0 ? 1 : 0;
