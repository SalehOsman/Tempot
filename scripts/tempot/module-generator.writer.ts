import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { buildModuleFiles } from './module-generator.templates.js';
import type { ModuleCreateInput, ModuleCreateResult } from './module-generator.types.js';
import { validateModuleName } from './module-generator.validation.js';

export async function createModule(input: ModuleCreateInput): Promise<ModuleCreateResult> {
  const validation = validateModuleName(input.moduleName);

  if (!validation.ok) {
    return { ok: false, error: validation.error };
  }

  const relativeModulePath = `modules/${validation.moduleName}`;
  const modulePath = join(input.cwd, 'modules', validation.moduleName);

  if (existsSync(modulePath)) {
    return { ok: false, error: `Module already exists: ${relativeModulePath}` };
  }

  try {
    const createdFiles = await writeModuleFiles(input.cwd, validation.moduleName);

    return { ok: true, moduleName: validation.moduleName, createdFiles };
  } catch (error) {
    return { ok: false, error: formatCreateError(error) };
  }
}

async function writeModuleFiles(cwd: string, moduleName: string): Promise<readonly string[]> {
  const createdFiles: string[] = [];

  for (const file of buildModuleFiles(moduleName)) {
    const relativeFilePath = `modules/${moduleName}/${file.path}`;
    const target = join(cwd, relativeFilePath);

    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, file.content, { flag: 'wx' });
    createdFiles.push(relativeFilePath);
  }

  return createdFiles;
}

function formatCreateError(error: unknown): string {
  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return 'Module creation failed.';
}
