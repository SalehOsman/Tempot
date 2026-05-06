import type { ModuleDoctorCheck, ModuleDoctorReport } from './module-doctor.types.js';

export function renderModuleDoctorReport(report: ModuleDoctorReport): string {
  const lines = [
    report.title,
    ...report.checks.map((check) => renderModuleCheck(check)),
    `Result: ${report.hasBlockingFailure ? 'blocking failures found' : 'ready'}`,
  ];

  return `${lines.join('\n')}\n`;
}

function renderModuleCheck(check: ModuleDoctorCheck): string {
  return `[${check.status}] ${check.name}: ${check.summary} Fix: ${check.suggestion}`;
}
