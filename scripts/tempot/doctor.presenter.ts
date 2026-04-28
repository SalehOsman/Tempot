import type { DoctorCheck, DoctorReport } from './doctor.checks.js';

export type TempotCommand =
  | { readonly command: 'doctor'; readonly mode: 'quick' }
  | { readonly command: 'unknown'; readonly mode: 'help' };

export function parseTempotArgs(args: readonly string[]): TempotCommand {
  const [command, mode] = args;

  if (command === 'doctor' && (mode === undefined || mode === '--quick')) {
    return { command: 'doctor', mode: 'quick' };
  }

  return { command: 'unknown', mode: 'help' };
}

export function renderDoctorReport(report: DoctorReport): string {
  const lines = [
    report.title,
    ...report.checks.map((check) => renderCheck(check)),
    `Result: ${report.hasBlockingFailure ? 'blocking failures found' : 'ready'}`,
  ];

  return `${lines.join('\n')}\n`;
}

export function renderHelp(): string {
  return [
    'Tempot CLI',
    '',
    'Usage:',
    '  pnpm tempot doctor --quick',
    '',
    'Available commands:',
    '  doctor --quick    Check Node.js, pnpm, Git, and install state.',
    '',
  ].join('\n');
}

function renderCheck(check: DoctorCheck): string {
  return `[${check.status}] ${check.name}: ${check.summary} Fix: ${check.suggestion}`;
}
