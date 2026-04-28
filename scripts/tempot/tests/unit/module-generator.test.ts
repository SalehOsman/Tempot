import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { parseTempotArgs } from '../../doctor.presenter.js';
import { renderModuleCreateResult } from '../../module-generator.presenter.js';
import { buildModuleFiles } from '../../module-generator.templates.js';
import { validateModuleName } from '../../module-generator.validation.js';
import { createModule } from '../../module-generator.writer.js';

describe('Tempot module generator', () => {
  it('should parse the module create command', () => {
    expect(parseTempotArgs(['module', 'create', 'person-registration'])).toEqual({
      command: 'module-create',
      moduleName: 'person-registration',
    });
  });

  it('should reject unsupported module names', () => {
    expect(validateModuleName('PersonRegistration')).toEqual({
      ok: false,
      error: 'Module name must be kebab-case, for example person-registration.',
    });
    expect(validateModuleName('../escape')).toEqual({
      ok: false,
      error: 'Module name must be kebab-case, for example person-registration.',
    });
  });

  it('should build the required starter module files', () => {
    const files = buildModuleFiles('person-registration');
    const paths = files.map((file) => file.path).sort();

    expect(paths).toEqual([
      '.gitignore',
      'abilities.ts',
      'features/index.ts',
      'index.ts',
      'locales/ar.json',
      'locales/en.json',
      'module.config.ts',
      'package.json',
      'shared/index.ts',
      'tests/module.config.test.ts',
      'tsconfig.json',
      'vitest.config.ts',
    ]);

    const packageFile = files.find((file) => file.path === 'package.json');
    expect(packageFile?.content).toContain('"name": "@tempot/person-registration"');
    expect(packageFile?.content).toContain('"types": "dist/index.d.ts"');
    expect(packageFile?.content).toContain('"exports"');

    const moduleConfig = files.find((file) => file.path === 'module.config.ts');
    expect(moduleConfig?.content).toContain("name: 'person-registration'");
    expect(moduleConfig?.content).toContain('isActive: false');
  });

  it('should write a module skeleton without overwriting existing modules', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'tempot-generator-'));

    try {
      const first = await createModule({ cwd, moduleName: 'person-registration' });

      expect(first.ok).toBe(true);
      if (!first.ok) {
        return;
      }

      expect(first.createdFiles).toContain('modules/person-registration/package.json');

      const packageFile = await readFile(
        join(cwd, 'modules', 'person-registration', 'package.json'),
        'utf8',
      );
      const localeFile = await readFile(
        join(cwd, 'modules', 'person-registration', 'locales', 'en.json'),
        'utf8',
      );

      expect(packageFile).toContain('@tempot/person-registration');
      expect(localeFile).toContain('"person-registration"');

      const second = await createModule({ cwd, moduleName: 'person-registration' });

      expect(second).toEqual({
        ok: false,
        error: 'Module already exists: modules/person-registration',
      });
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });

  it('should render module creation results without secret values', () => {
    const output = renderModuleCreateResult({
      ok: true,
      moduleName: 'person-registration',
      createdFiles: ['modules/person-registration/package.json'],
    });

    expect(output).toContain('Tempot Module Generator');
    expect(output).toContain('person-registration');
    expect(output).toContain('modules/person-registration/package.json');
    expect(output).not.toContain('BOT_TOKEN');
    expect(output).not.toContain('TELEGRAM_TOKEN');
  });
});
