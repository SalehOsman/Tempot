import { describe, expect, it } from 'vitest';
import { createQuickDoctorReport, resolvePnpmVersion } from '../../doctor.checks.js';
import { parseTempotArgs, renderDoctorReport } from '../../doctor.presenter.js';

describe('Tempot doctor quick mode', () => {
  it('should report pass statuses when quick prerequisites are available', () => {
    const report = createQuickDoctorReport({
      cwd: 'F:/Tempot',
      gitBranch: 'codex/tempot-doctor',
      hasLockfile: true,
      hasNodeModules: true,
      nodeVersion: 'v22.12.0',
      pnpmVersion: '10.32.1',
    });

    expect(report.title).toBe('Tempot Doctor');
    expect(report.checks).toHaveLength(4);
    expect(report.checks.map((check) => check.status)).toEqual(['pass', 'pass', 'pass', 'pass']);
    expect(report.hasBlockingFailure).toBe(false);
  });

  it('should mark blocking failures when required quick prerequisites are missing', () => {
    const report = createQuickDoctorReport({
      cwd: 'F:/Tempot',
      gitBranch: '',
      hasLockfile: false,
      hasNodeModules: false,
      nodeVersion: 'v20.11.0',
      pnpmVersion: '9.15.0',
    });

    expect(report.checks.map((check) => check.status)).toEqual(['fail', 'fail', 'fail', 'fail']);
    expect(report.hasBlockingFailure).toBe(true);
  });

  it('should render a stable developer-facing report without secret values', () => {
    const report = createQuickDoctorReport({
      cwd: 'F:/Tempot',
      gitBranch: 'main',
      hasLockfile: true,
      hasNodeModules: true,
      nodeVersion: 'v22.12.0',
      pnpmVersion: '10.32.1',
    });

    const output = renderDoctorReport(report);

    expect(output).toContain('Tempot Doctor');
    expect(output).toContain('[pass] Node.js');
    expect(output).toContain('[pass] pnpm');
    expect(output).toContain('[pass] Git branch');
    expect(output).toContain('[pass] Install state');
    expect(output).not.toContain('BOT_TOKEN');
    expect(output).not.toContain('TELEGRAM_TOKEN');
  });

  it('should parse only the supported quick doctor command', () => {
    expect(parseTempotArgs(['doctor', '--quick'])).toEqual({
      command: 'doctor',
      mode: 'quick',
    });
    expect(parseTempotArgs(['doctor'])).toEqual({
      command: 'doctor',
      mode: 'quick',
    });
    expect(parseTempotArgs(['module', 'create'])).toEqual({
      command: 'unknown',
      mode: 'help',
    });
  });

  it('should resolve pnpm version from npm user agent before shell fallback', () => {
    const version = resolvePnpmVersion('pnpm/10.32.1 npm/? node/v24.11.1 win32 x64', '');

    expect(version).toBe('10.32.1');
  });
});
