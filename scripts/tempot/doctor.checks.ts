import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export type DoctorStatus = 'pass' | 'warn' | 'fail' | 'skipped';

export interface DoctorCheck {
  readonly name: string;
  readonly status: DoctorStatus;
  readonly summary: string;
  readonly suggestion: string;
  readonly blocking: boolean;
}

export interface DoctorReport {
  readonly title: string;
  readonly checks: readonly DoctorCheck[];
  readonly hasBlockingFailure: boolean;
}

export interface QuickDoctorInput {
  readonly cwd: string;
  readonly nodeVersion: string;
  readonly pnpmVersion: string;
  readonly gitBranch: string;
  readonly hasLockfile: boolean;
  readonly hasNodeModules: boolean;
}

interface VersionRequirement {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
}

const MIN_NODE: VersionRequirement = { major: 22, minor: 12, patch: 0 };
const MIN_PNPM: VersionRequirement = { major: 10, minor: 0, patch: 0 };

export function createQuickDoctorReport(input: QuickDoctorInput): DoctorReport {
  const checks = [checkNode(input), checkPnpm(input), checkGit(input), checkInstall(input)];

  return {
    title: 'Tempot Doctor',
    checks,
    hasBlockingFailure: checks.some((check) => check.blocking && check.status === 'fail'),
  };
}

export function collectQuickDoctorInput(cwd = process.cwd()): QuickDoctorInput {
  return {
    cwd,
    nodeVersion: process.version,
    pnpmVersion: resolvePnpmVersion(
      process.env['npm_config_user_agent'] ?? '',
      readCommand('pnpm', ['--version']),
    ),
    gitBranch: readCommand('git', ['rev-parse', '--abbrev-ref', 'HEAD']),
    hasLockfile: existsSync(join(cwd, 'pnpm-lock.yaml')),
    hasNodeModules: existsSync(join(cwd, 'node_modules')),
  };
}

export function resolvePnpmVersion(userAgent: string, commandVersion: string): string {
  const match = userAgent.match(/pnpm\/(\d+\.\d+\.\d+)/);

  return match?.[1] ?? commandVersion;
}

function checkNode(input: QuickDoctorInput): DoctorCheck {
  const meetsRequirement = isAtLeast(input.nodeVersion, MIN_NODE);

  return {
    name: 'Node.js',
    status: meetsRequirement ? 'pass' : 'fail',
    summary: `${input.nodeVersion} detected; required >=22.12.0`,
    suggestion: meetsRequirement ? 'No action needed.' : 'Install Node.js 22.12.0 or newer.',
    blocking: true,
  };
}

function checkPnpm(input: QuickDoctorInput): DoctorCheck {
  const meetsRequirement = isAtLeast(input.pnpmVersion, MIN_PNPM);

  return {
    name: 'pnpm',
    status: meetsRequirement ? 'pass' : 'fail',
    summary: input.pnpmVersion
      ? `${input.pnpmVersion} detected; required >=10.0.0`
      : 'pnpm not found',
    suggestion: meetsRequirement ? 'No action needed.' : 'Install pnpm 10 or newer.',
    blocking: true,
  };
}

function checkGit(input: QuickDoctorInput): DoctorCheck {
  const hasBranch = input.gitBranch.trim().length > 0;

  return {
    name: 'Git branch',
    status: hasBranch ? 'pass' : 'fail',
    summary: hasBranch ? `Current branch: ${input.gitBranch}` : 'Unable to read current branch',
    suggestion: hasBranch ? 'No action needed.' : 'Run inside a Git worktree or repository.',
    blocking: true,
  };
}

function checkInstall(input: QuickDoctorInput): DoctorCheck {
  const installed = input.hasLockfile && input.hasNodeModules;

  return {
    name: 'Install state',
    status: installed ? 'pass' : 'fail',
    summary: installed
      ? 'Lockfile and node_modules are present.'
      : 'Install artifacts are missing.',
    suggestion: installed ? 'No action needed.' : 'Run pnpm install --frozen-lockfile.',
    blocking: true,
  };
}

function isAtLeast(version: string, minimum: VersionRequirement): boolean {
  const parsed = parseVersion(version);

  if (parsed.major !== minimum.major) {
    return parsed.major > minimum.major;
  }

  if (parsed.minor !== minimum.minor) {
    return parsed.minor > minimum.minor;
  }

  return parsed.patch >= minimum.patch;
}

function parseVersion(version: string): VersionRequirement {
  const match = version.match(/(\d+)\.(\d+)\.(\d+)/);

  if (!match) {
    return { major: 0, minor: 0, patch: 0 };
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

function readCommand(command: string, args: readonly string[]): string {
  try {
    return execFileSync(command, [...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}
