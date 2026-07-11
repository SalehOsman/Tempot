import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createQuickDoctorReport, resolvePnpmVersion } from '../../doctor.checks.js';
import { parseTempotArgs, renderDoctorReport } from '../../doctor.presenter.js';
import { createModuleDoctorReport } from '../../module-doctor.checks.js';
import { renderModuleDoctorReport } from '../../module-doctor.presenter.js';

describe('Tempot doctor quick mode', () => {
  it('should report pass statuses when quick prerequisites are available', () => {
    const report = createQuickDoctorReport({
      cwd: 'F:/Tempot',
      gitBranch: 'codex/tempot-doctor',
      hasLockfile: true,
      hasNodeModules: true,
      methodologyLintPassed: true,
      nodeVersion: 'v22.12.0',
      pnpmVersion: '10.32.1',
    });

    expect(report.title).toBe('Tempot Doctor');
    expect(report.checks).toHaveLength(5);
    expect(report.checks.map((check) => check.status)).toEqual([
      'pass',
      'pass',
      'pass',
      'pass',
      'pass',
    ]);
    expect(report.hasBlockingFailure).toBe(false);
  });

  it('should mark blocking failures when required quick prerequisites are missing', () => {
    const report = createQuickDoctorReport({
      cwd: 'F:/Tempot',
      gitBranch: '',
      hasLockfile: false,
      hasNodeModules: false,
      methodologyLintPassed: false,
      nodeVersion: 'v20.11.0',
      pnpmVersion: '9.15.0',
    });

    expect(report.checks.map((check) => check.status)).toEqual([
      'fail',
      'fail',
      'fail',
      'fail',
      'fail',
    ]);
    expect(report.hasBlockingFailure).toBe(true);
  });

  it('should render a stable developer-facing report without secret values', () => {
    const report = createQuickDoctorReport({
      cwd: 'F:/Tempot',
      gitBranch: 'main',
      hasLockfile: true,
      hasNodeModules: true,
      methodologyLintPassed: true,
      nodeVersion: 'v22.12.0',
      pnpmVersion: '10.32.1',
    });

    const output = renderDoctorReport(report);

    expect(output).toContain('Tempot Doctor');
    expect(output).toContain('[pass] Node.js');
    expect(output).toContain('[pass] pnpm');
    expect(output).toContain('[pass] Git branch');
    expect(output).toContain('[pass] Install state');
    expect(output).toContain('[pass] Methodology lint');
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

describe('Tempot module doctor', () => {
  it('should parse the module doctor command', () => {
    expect(parseTempotArgs(['module', 'doctor', 'person-registration'])).toEqual({
      command: 'module-doctor',
      moduleName: 'person-registration',
    });
  });

  it('should fail when the requested module does not exist', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'tempot-module-doctor-missing-'));

    try {
      const report = await createModuleDoctorReport({ cwd, moduleName: 'missing-module' });

      expect(report.title).toBe('Tempot Module Doctor: missing-module');
      expect(report.hasBlockingFailure).toBe(true);
      expect(report.checks).toContainEqual({
        name: 'Module directory',
        status: 'fail',
        summary: 'Module directory not found: modules/missing-module',
        suggestion: 'Create the module first with pnpm tempot module create missing-module.',
        blocking: true,
      });
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });

  it('should report readiness checks without secret values', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'tempot-module-doctor-ready-'));

    try {
      await writeReadyModule(cwd, 'person-registration');

      const report = await createModuleDoctorReport({ cwd, moduleName: 'person-registration' });
      const output = renderModuleDoctorReport(report);

      expect(report.hasBlockingFailure).toBe(false);
      expect(report.checks.map((check) => check.status)).toEqual([
        'pass',
        'pass',
        'pass',
        'pass',
        'pass',
        'warn',
      ]);
      expect(output).toContain('Tempot Module Doctor: person-registration');
      expect(output).toContain('[pass] Required files');
      expect(output).toContain('[pass] Package metadata');
      expect(output).toContain('[pass] Locale parity');
      expect(output).toContain('[pass] Module imports');
      expect(output).toContain('[warn] Module flow map');
      expect(output).not.toContain('BOT_TOKEN');
      expect(output).not.toContain('TELEGRAM_TOKEN');
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });

  it('should fail required file, metadata, locale, and module import checks', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'tempot-module-doctor-fail-'));

    try {
      const modulePath = join(cwd, 'modules', 'person-registration');
      await mkdir(join(modulePath, 'locales'), { recursive: true });
      await writeFile(
        join(modulePath, 'package.json'),
        JSON.stringify({ name: '@tempot/person-registration', scripts: { build: 'tsc' } }),
      );
      await writeFile(
        join(modulePath, 'locales', 'ar.json'),
        JSON.stringify({ module: { title: 'ar', ready: 'ar' } }),
      );
      await writeFile(
        join(modulePath, 'locales', 'en.json'),
        JSON.stringify({ module: { title: 'en' } }),
      );
      await writeFile(
        join(modulePath, 'index.ts'),
        "import other from '../another-module/index.js';\nexport { other };\n",
      );

      const report = await createModuleDoctorReport({ cwd, moduleName: 'person-registration' });

      expect(report.hasBlockingFailure).toBe(true);
      expect(report.checks.map((check) => check.status)).toEqual([
        'pass',
        'fail',
        'fail',
        'fail',
        'fail',
        'warn',
      ]);
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });
});

async function writeReadyModule(cwd: string, moduleName: string): Promise<void> {
  const modulePath = join(cwd, 'modules', moduleName);
  await mkdir(join(modulePath, 'locales'), { recursive: true });
  await writeFile(
    join(modulePath, 'package.json'),
    JSON.stringify({
      name: `@tempot/${moduleName}`,
      main: 'dist/index.js',
      types: 'dist/index.d.ts',
      exports: {
        '.': {
          types: './dist/index.d.ts',
          import: './dist/index.js',
        },
      },
      scripts: {
        build: 'tsc',
        test: 'vitest run',
      },
    }),
  );
  await writeFile(join(modulePath, 'module.config.ts'), 'export default {};\n');
  await writeFile(
    join(modulePath, 'module.manifest.ts'),
    "export const moduleManifest = { name: 'person-registration' } as const;\n",
  );
  await writeFile(join(modulePath, 'index.ts'), 'export {};\n');
  await writeFile(
    join(modulePath, 'locales', 'ar.json'),
    JSON.stringify({ module: { title: 'ar' } }),
  );
  await writeFile(
    join(modulePath, 'locales', 'en.json'),
    JSON.stringify({ module: { title: 'en' } }),
  );
}
