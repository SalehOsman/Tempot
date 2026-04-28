import type { DoctorCheck, DoctorReport } from './doctor.checks.js';

export type TempotCommand =
  | { readonly command: 'doctor'; readonly mode: 'quick' }
  | { readonly command: 'init' }
  | { readonly command: 'module-create'; readonly moduleName: string }
  | { readonly command: 'unknown'; readonly mode: 'help' };

export function parseTempotArgs(args: readonly string[]): TempotCommand {
  const [command, mode, moduleName] = args;

  if (command === 'doctor' && (mode === undefined || mode === '--quick')) {
    return { command: 'doctor', mode: 'quick' };
  }

  if (command === 'init' && mode === undefined) {
    return { command: 'init' };
  }

  if (command === 'module' && mode === 'create' && moduleName !== undefined) {
    return { command: 'module-create', moduleName };
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
    '  pnpm tempot init',
    '  pnpm tempot doctor --quick',
    '  pnpm tempot module create <module-name>',
    '',
    'Available commands:',
    '  init              Create local starter files without overwriting existing files.',
    '  doctor --quick    Check Node.js, pnpm, Git, and install state.',
    '  module create     Create a governed inactive module skeleton.',
    '',
  ].join('\n');
}

function renderCheck(check: DoctorCheck): string {
  return `[${check.status}] ${check.name}: ${check.summary} Fix: ${check.suggestion}`;
}
