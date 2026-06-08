import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export type TestProjectType = 'app' | 'package' | 'module' | 'script';
export type TestKind = 'unit' | 'integration' | 'e2e' | 'application';

export interface TestProjectInventoryEntry {
  workspaceName: string;
  workspacePath: string;
  projectType: TestProjectType;
  testKinds: TestKind[];
  command: string;
  required: boolean;
  testFileCount: number;
}

interface WorkspaceManifest {
  name?: unknown;
}

const TEST_FILE_PATTERN = /\.(?:test|spec)\.[cm]?[jt]sx?$/;

function parseWorkspacePatterns(contents: string): string[] {
  const patterns: string[] = [];
  let inPackages = false;

  for (const line of contents.split(/\r?\n/)) {
    if (/^packages:\s*$/.test(line)) {
      inPackages = true;
      continue;
    }
    if (inPackages && /^\S/.test(line)) break;

    const match = inPackages ? line.match(/^\s*-\s*['"]([^'"]+)['"]\s*$/) : null;
    if (match?.[1]) patterns.push(match[1]);
  }

  if (patterns.length === 0) {
    throw new Error('pnpm-workspace.yaml does not define any package patterns');
  }
  return patterns;
}

async function directoriesForPattern(repositoryRoot: string, pattern: string): Promise<string[]> {
  if (!pattern.endsWith('/*')) {
    throw new Error(`Unsupported workspace pattern: ${pattern}`);
  }

  const parent = pattern.slice(0, -2);
  const absoluteParent = path.join(repositoryRoot, parent);
  let entries;
  try {
    entries = await readdir(absoluteParent, { withFileTypes: true });
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.posix.join(parent.replaceAll('\\', '/'), entry.name));
}

async function findTestFiles(directory: string): Promise<string[]> {
  const files: string[] = [];

  async function visit(current: string): Promise<void> {
    let entries;
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
      throw error;
    }

    for (const entry of entries) {
      if (entry.name === 'dist' || entry.name === 'node_modules') continue;
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await visit(entryPath);
      } else if (TEST_FILE_PATTERN.test(entry.name)) {
        files.push(entryPath);
      }
    }
  }

  await visit(path.join(directory, 'tests'));
  return files;
}

function testKind(file: string): TestKind {
  const normalized = file.replaceAll('\\', '/');
  if (normalized.includes('/tests/unit/')) return 'unit';
  if (normalized.includes('/tests/integration/')) return 'integration';
  if (normalized.includes('/tests/e2e/')) return 'e2e';
  return 'application';
}

function projectType(workspacePath: string): TestProjectType {
  if (workspacePath.startsWith('apps/')) return 'app';
  if (workspacePath.startsWith('packages/')) return 'package';
  if (workspacePath.startsWith('modules/')) return 'module';
  return 'script';
}

async function manifestName(repositoryRoot: string, workspacePath: string): Promise<string> {
  const manifestPath = path.join(repositoryRoot, workspacePath, 'package.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as WorkspaceManifest;
  if (typeof manifest.name !== 'string' || manifest.name.length === 0) {
    throw new Error(`${workspacePath}/package.json must define a non-empty name`);
  }
  return manifest.name;
}

async function workspaceEntry(
  repositoryRoot: string,
  workspacePath: string,
  workspaceName: string,
): Promise<TestProjectInventoryEntry> {
  const absolutePath = path.join(repositoryRoot, workspacePath);
  const testFiles = await findTestFiles(absolutePath);
  const testKinds = [...new Set(testFiles.map(testKind))].sort();

  return {
    workspaceName,
    workspacePath,
    projectType: projectType(workspacePath),
    testKinds,
    command: `vitest run ${workspacePath}/tests`,
    required: true,
    testFileCount: testFiles.length,
  };
}

async function scriptEntries(repositoryRoot: string): Promise<TestProjectInventoryEntry[]> {
  const scriptsRoot = path.join(repositoryRoot, 'scripts');
  let directories;
  try {
    directories = await readdir(scriptsRoot, { withFileTypes: true });
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
  const entries: TestProjectInventoryEntry[] = [];

  for (const directory of directories.filter((entry) => entry.isDirectory())) {
    const workspacePath = path.posix.join('scripts', directory.name);
    const entry = await workspaceEntry(repositoryRoot, workspacePath, `scripts/${directory.name}`);
    if (entry.testFileCount > 0) entries.push(entry);
  }
  return entries;
}

export async function buildTestProjectInventory(
  repositoryRoot: string,
): Promise<TestProjectInventoryEntry[]> {
  const workspaceFile = await readFile(path.join(repositoryRoot, 'pnpm-workspace.yaml'), 'utf8');
  const patterns = parseWorkspacePatterns(workspaceFile);
  const workspacePaths = (
    await Promise.all(patterns.map((pattern) => directoriesForPattern(repositoryRoot, pattern)))
  ).flat();

  const workspaceEntries = await Promise.all(
    workspacePaths.map(async (workspacePath) =>
      workspaceEntry(
        repositoryRoot,
        workspacePath,
        await manifestName(repositoryRoot, workspacePath),
      ),
    ),
  );

  return [...workspaceEntries, ...(await scriptEntries(repositoryRoot))].sort((left, right) =>
    left.workspacePath.localeCompare(right.workspacePath),
  );
}

async function main(): Promise<void> {
  const repositoryRoot = path.resolve(process.cwd());
  const inventory = await buildTestProjectInventory(repositoryRoot);

  for (const entry of inventory) {
    const kinds = entry.testKinds.length > 0 ? entry.testKinds.join(',') : 'none';
    process.stdout.write(
      `${entry.workspacePath}: type=${entry.projectType} testFiles=${entry.testFileCount} kinds=${kinds}\n`,
    );
  }

  const testFileCount = inventory.reduce((total, entry) => total + entry.testFileCount, 0);
  const testlessCount = inventory.filter((entry) => entry.testFileCount === 0).length;
  process.stdout.write(
    `Test inventory: workspaces=${inventory.length} testFiles=${testFileCount} testless=${testlessCount}\n`,
  );
}

const entryPoint = process.argv[1];
if (entryPoint && import.meta.url === pathToFileURL(entryPoint).href) {
  await main();
}
