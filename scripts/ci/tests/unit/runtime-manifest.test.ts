import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { generateRuntimeManifest } from '../../runtime-manifest.js';

async function writeJson(path: string, value: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

async function createModule(root: string, name: string): Promise<void> {
  const moduleDir = join(root, 'modules', name);
  await mkdir(join(moduleDir, 'dist'), { recursive: true });
  await mkdir(join(moduleDir, 'locales'), { recursive: true });
  await mkdir(join(moduleDir, 'features'), { recursive: true });
  await mkdir(join(moduleDir, 'shared'), { recursive: true });
  await writeFile(join(moduleDir, 'module.config.ts'), '');
  await writeFile(join(moduleDir, 'abilities.ts'), '');
  await writeFile(join(moduleDir, 'index.ts'), '');
  await writeFile(join(moduleDir, 'dist', 'module.config.js'), '');
  await writeFile(join(moduleDir, 'dist', 'index.js'), '');
  await writeJson(join(moduleDir, 'locales', 'ar.json'), {});
  await writeJson(join(moduleDir, 'locales', 'en.json'), {});
}

describe('generateRuntimeManifest', () => {
  it('writes minimal runtime metadata for active modules and packages', async ({ task }) => {
    const root = join(process.cwd(), 'temp', 'tests', task.id);
    await createModule(root, 'test-module');
    await mkdir(join(root, 'packages', 'shared'), { recursive: true });
    await mkdir(join(root, 'specs', '019-test-module'), { recursive: true });
    await writeFile(join(root, 'specs', '019-test-module', 'spec.md'), '# Test Module\n');

    const outputPath = join(root, 'runtime', 'runtime-manifest.json');
    await generateRuntimeManifest({
      root,
      outputPath,
    });

    const manifest = JSON.parse(await readFile(outputPath, 'utf8')) as {
      version: number;
      modules: Array<{ name: string; specDir: string }>;
      packages: string[];
    };

    expect(manifest).toEqual({
      version: 1,
      modules: [{ name: 'test-module', specDir: '019-test-module' }],
      packages: ['shared'],
    });
  });

  it('rejects modules that would require source files inside the runner image', async ({ task }) => {
    const root = join(process.cwd(), 'temp', 'tests', task.id);
    await createModule(root, 'test-module');
    await mkdir(join(root, 'packages', 'shared'), { recursive: true });
    await mkdir(join(root, 'specs', '019-test-module'), { recursive: true });
    await writeFile(join(root, 'specs', '019-test-module', 'spec.md'), '# Test Module\n');
    await writeFile(join(root, 'modules', 'test-module', 'index.ts'), '');

    await expect(
      generateRuntimeManifest({
        root,
        outputPath: join(root, 'runtime', 'runtime-manifest.json'),
        forbiddenRuntimePaths: ['index.ts'],
      }),
    ).rejects.toThrow('Forbidden runtime source path');
  });
});
