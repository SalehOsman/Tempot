import type { DoctorCheck, DoctorReport } from './doctor.checks.js';

export type TempotCommand =
  | { readonly command: 'doctor'; readonly mode: 'quick' }
  | { readonly command: 'init' }
  | {
      readonly command: 'module-create';
      readonly moduleName: string;
      readonly moduleType: string;
      readonly blueprint: string;
    }
  | { readonly command: 'module-doctor'; readonly moduleName: string }
  | { readonly command: 'unknown'; readonly mode: 'help' };

export function parseTempotArgs(args: readonly string[]): TempotCommand {
  const [command, mode, moduleName, ...rest] = args;

  if (command === 'doctor' && (mode === undefined || mode === '--quick')) {
    return { command: 'doctor', mode: 'quick' };
  }

  if (command === 'init' && mode === undefined) {
    return { command: 'init' };
  }

  if (command === 'module' && mode === 'doctor' && moduleName !== undefined && rest.length === 0) {
    return { command: 'module-doctor', moduleName };
  }

  if (command === 'module' && mode === 'create' && moduleName !== undefined) {
    const options = parseModuleCreateOptions(rest);

    if (options === undefined) {
      return { command: 'unknown', mode: 'help' };
    }

    return {
      command: 'module-create',
      moduleName,
      moduleType: options.moduleType,
      blueprint: options.blueprint,
    };
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
    '  pnpm tempot module doctor <module-name>',
    '  pnpm tempot module create <module-name>',
    '  pnpm tempot module create <module-name> --type <type> --blueprint basic',
    '',
    'Available commands:',
    '  init              Create local starter files without overwriting existing files.',
    '  doctor --quick    Check Node.js, pnpm, Git, and install state.',
    '  module doctor     Check an existing module readiness profile.',
    '  module create     Create a governed inactive module skeleton.',
    '',
  ].join('\n');
}

function renderCheck(check: DoctorCheck): string {
  return `[${check.status}] ${check.name}: ${check.summary} Fix: ${check.suggestion}`;
}

function parseModuleCreateOptions(
  args: readonly string[],
): { readonly moduleType: string; readonly blueprint: string } | undefined {
  let moduleType = 'product';
  let blueprint = 'basic';

  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index];
    const value = args[index + 1];

    if (flag === undefined || value === undefined) {
      return undefined;
    }

    if (flag === '--type') {
      moduleType = value;
      continue;
    }

    if (flag === '--blueprint') {
      blueprint = value;
      continue;
    }

    return undefined;
  }

  return { moduleType, blueprint };
}
