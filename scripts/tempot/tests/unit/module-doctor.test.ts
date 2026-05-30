import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { createModuleDoctorReport } from '../../module-doctor.checks.js';

async function createModuleFixture(moduleName: string) {
  const cwd = await mkdtemp(join(tmpdir(), 'tempot-module-doctor-'));
  const modulePath = join(cwd, 'modules', moduleName);
  await writeFile(join(modulePath, '.keep'), '', { flag: 'w' }).catch(async () => {
    await import('node:fs/promises').then(({ mkdir }) => mkdir(modulePath, { recursive: true }));
    await writeFile(join(modulePath, '.keep'), '');
  });
  await import('node:fs/promises').then(({ mkdir }) =>
    mkdir(join(modulePath, 'locales'), { recursive: true }),
  );
  await writeFile(
    join(modulePath, 'package.json'),
    JSON.stringify({
      main: 'dist/index.js',
      types: 'dist/index.d.ts',
      exports: { '.': './dist/index.js' },
      scripts: { build: 'tsc', test: 'vitest run' },
    }),
  );
  await writeFile(join(modulePath, 'module.config.ts'), 'export const config = {};');
  await writeFile(join(modulePath, 'module.manifest.ts'), 'export const moduleManifest = {};');
  await writeFile(
    join(modulePath, 'locales', 'en.json'),
    JSON.stringify({ demo: { menu: { open: 'Open', back: 'Back' } } }),
  );
  await writeFile(
    join(modulePath, 'locales', 'ar.json'),
    JSON.stringify({ demo: { menu: { open: 'فتح', back: 'رجوع' } } }),
  );
  return { cwd, modulePath };
}

describe('Tempot module doctor', () => {
  it('should pass settings-management flow governance when its flow map is complete', async () => {
    const report = await createModuleDoctorReport({
      cwd: process.cwd(),
      moduleName: 'settings-management',
    });
    const flowCheck = report.checks.find((check) => check.name === 'Module flow map');

    expect(flowCheck?.status).toBe('pass');
    expect(flowCheck?.summary).toBe(
      'Module flow map callbacks, leaf surfaces, handlers, and labels are aligned.',
    );
  });

  it('should pass notification-center flow governance when its flow map is complete', async () => {
    const report = await createModuleDoctorReport({
      cwd: process.cwd(),
      moduleName: 'notification-center',
    });
    const flowCheck = report.checks.find((check) => check.name === 'Module flow map');

    expect(flowCheck?.status).toBe('pass');
    expect(flowCheck?.summary).toBe(
      'Module flow map callbacks, leaf surfaces, handlers, and labels are aligned.',
    );
  });

  it('should detect repeated leaf callbacks and missing callback handlers', async () => {
    const { cwd, modulePath } = await createModuleFixture('demo-module');

    try {
      await writeFile(
        join(modulePath, 'module.flow.json'),
        JSON.stringify({
          moduleName: 'demo-module',
          entryPoints: ['demo'],
          surfaces: [
            {
              surfaceId: 'demo.leaf',
              surfaceType: 'leaf',
              openedBy: 'demo:open',
              visibleActions: ['demo:open', 'ghost:missing'],
            },
          ],
          callbackActions: [
            {
              callbackData: 'demo:open',
              actionKind: 'navigation',
              handlerStatus: 'handled',
              labelKey: 'demo.menu.open',
            },
            {
              callbackData: 'ghost:missing',
              actionKind: 'navigation',
              handlerStatus: 'handled',
              labelKey: 'demo.menu.back',
            },
          ],
          exitPaths: [],
        }),
      );
      await writeFile(join(modulePath, 'callback.handler.ts'), "export const namespace = 'demo:';");

      const report = await createModuleDoctorReport({ cwd, moduleName: 'demo-module' });
      const flowCheck = report.checks.find((check) => check.name === 'Module flow map');

      expect(flowCheck?.status).toBe('fail');
      expect(flowCheck?.summary).toContain('Leaf surface demo.leaf repeats demo:open');
      expect(flowCheck?.summary).toContain(
        'Callback ghost:missing has no matching handler namespace',
      );
      expect(report.hasBlockingFailure).toBe(true);
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });
});
