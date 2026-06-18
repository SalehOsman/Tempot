import { mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

interface RuntimeManifestOptions {
  root: string;
  outputPath: string;
  forbiddenRuntimePaths?: string[];
}

interface RuntimeManifestModule {
  name: string;
  specDir: string;
}

interface RuntimeModuleManifest {
  version: 1;
  modules: RuntimeManifestModule[];
  packages: string[];
}

interface ModuleEntryOptions {
  root: string;
  moduleName: string;
  specDirs: readonly string[];
  forbiddenRuntimePaths: readonly string[];
}

const REQUIRED_MODULE_PATHS = [
  'module.config.ts',
  'abilities.ts',
  'locales/ar.json',
  'locales/en.json',
  'index.ts',
  'features',
  'shared',
  'dist/module.config.js',
  'dist/index.js',
] as const;

async function listDirectories(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

function matchingSpec(moduleName: string, specDirs: readonly string[]): string | undefined {
  return specDirs.find((dir) => {
    const stripped = dir.replace(/^\d+-/u, '');
    return stripped === moduleName || stripped === `${moduleName}-package`;
  });
}

async function assertRequiredModulePaths(root: string, moduleName: string): Promise<void> {
  const moduleRoot = path.join(root, 'modules', moduleName);
  for (const requiredPath of REQUIRED_MODULE_PATHS) {
    const candidate = path.join(moduleRoot, requiredPath);
    if (!(await pathExists(candidate))) {
      throw new Error(`Missing module runtime input: ${moduleName}/${requiredPath}`);
    }
  }
}

async function assertForbiddenRuntimePaths(
  root: string,
  moduleName: string,
  forbiddenRuntimePaths: readonly string[],
): Promise<void> {
  const moduleRoot = path.join(root, 'modules', moduleName);
  for (const forbiddenPath of forbiddenRuntimePaths) {
    const candidate = path.join(moduleRoot, forbiddenPath);
    if (await pathExists(candidate)) {
      throw new Error(`Forbidden runtime source path: ${moduleName}/${forbiddenPath}`);
    }
  }
}

async function buildModuleEntry(options: ModuleEntryOptions): Promise<RuntimeManifestModule> {
  const { root, moduleName, specDirs, forbiddenRuntimePaths } = options;
  await assertRequiredModulePaths(root, moduleName);
  await assertForbiddenRuntimePaths(root, moduleName, forbiddenRuntimePaths);

  const specDir = matchingSpec(moduleName, specDirs);
  if (!specDir) {
    throw new Error(`Missing SpecKit source for module: ${moduleName}`);
  }
  const specPath = path.join(root, 'specs', specDir, 'spec.md');
  if (!(await pathExists(specPath))) {
    throw new Error(`Missing SpecKit spec.md for module: ${moduleName}`);
  }

  return { name: moduleName, specDir };
}

export async function generateRuntimeManifest(
  options: RuntimeManifestOptions,
): Promise<RuntimeModuleManifest> {
  const modules = await listDirectories(path.join(options.root, 'modules'));
  const packages = await listDirectories(path.join(options.root, 'packages'));
  const specDirs = await listDirectories(path.join(options.root, 'specs'));
  const forbiddenRuntimePaths = options.forbiddenRuntimePaths ?? [];
  const manifestModules: RuntimeManifestModule[] = [];

  for (const moduleName of modules) {
    manifestModules.push(
      await buildModuleEntry({
        root: options.root,
        moduleName,
        specDirs,
        forbiddenRuntimePaths,
      }),
    );
  }

  const manifest: RuntimeModuleManifest = {
    version: 1,
    modules: manifestModules,
    packages,
  };

  await mkdir(path.dirname(options.outputPath), { recursive: true });
  await writeFile(options.outputPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

async function main(): Promise<void> {
  const root = process.cwd();
  const outputPath = path.join(root, 'runtime', 'runtime-manifest.json');
  const manifest = await generateRuntimeManifest({ root, outputPath });
  process.stdout.write(
    `Runtime manifest: modules=${manifest.modules.length} packages=${manifest.packages.length}\n`,
  );
}

const entryPoint = process.argv[1];
if (entryPoint && import.meta.url === pathToFileURL(entryPoint).href) {
  await main();
}
