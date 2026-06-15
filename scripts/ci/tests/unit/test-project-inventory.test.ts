import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { buildTestProjectInventory } from '../../test-project-inventory.js';

const temporaryRoots: string[] = [];

async function createRepository(): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), 'tempot-test-inventory-'));
  temporaryRoots.push(root);
  await writeFile(
    path.join(root, 'pnpm-workspace.yaml'),
    "packages:\n  - 'apps/*'\n  - 'packages/*'\n  - 'modules/*'\n",
  );
  return root;
}

async function createWorkspace(
  root: string,
  options: {
    workspacePath: string;
    packageName: string;
    testPath?: string;
  },
): Promise<void> {
  const { workspacePath, packageName, testPath } = options;
  const directory = path.join(root, workspacePath);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, 'package.json'), JSON.stringify({ name: packageName }));

  if (testPath) {
    const absoluteTestPath = path.join(directory, testPath);
    await mkdir(path.dirname(absoluteTestPath), { recursive: true });
    await writeFile(absoluteTestPath, "import { it } from 'vitest';\nit('runs', () => {});\n");
  }
}

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { recursive: true })));
});

describe('buildTestProjectInventory', () => {
  it('includes governed applications and their discovered test kinds', async () => {
    const root = await createRepository();
    await createWorkspace(root, {
      workspacePath: 'apps/api',
      packageName: 'api',
      testPath: 'tests/unit/health.test.ts',
    });

    const inventory = await buildTestProjectInventory(root);

    expect(inventory).toContainEqual(
      expect.objectContaining({
        workspaceName: 'api',
        workspacePath: 'apps/api',
        projectType: 'app',
        testKinds: ['unit'],
        testFileCount: 1,
      }),
    );
  });

  it('reports governed workspaces with no tests instead of omitting them', async () => {
    const root = await createRepository();
    await createWorkspace(root, {
      workspacePath: 'apps/docs',
      packageName: 'docs',
    });

    const inventory = await buildTestProjectInventory(root);

    expect(inventory).toContainEqual(
      expect.objectContaining({
        workspaceName: 'docs',
        workspacePath: 'apps/docs',
        testKinds: [],
        testFileCount: 0,
      }),
    );
  });
});
