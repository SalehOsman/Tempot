import { access, copyFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { InitOptions, InitResult } from './init.types.js';

const MISSING_ENV_EXAMPLE =
  'Missing .env.example. Run this command from the Tempot repository root.';

export async function initializeTempotProject(options: InitOptions): Promise<InitResult> {
  try {
    return await initializeProject(options);
  } catch (error) {
    return {
      ok: false,
      error: `Initialization failed: ${formatError(error)}`,
    };
  }
}

async function initializeProject(options: InitOptions): Promise<InitResult> {
  const envExamplePath = join(options.cwd, '.env.example');
  const envPath = join(options.cwd, '.env');

  if (!(await fileExists(envExamplePath))) {
    return { ok: false, error: MISSING_ENV_EXAMPLE };
  }

  if (await fileExists(envPath)) {
    return {
      ok: true,
      createdEnvFile: false,
      skippedExistingEnvFile: true,
    };
  }

  await copyFile(envExamplePath, envPath);

  return {
    ok: true,
    createdEnvFile: true,
    skippedExistingEnvFile: false,
  };
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch (error) {
    if (isMissingFileError(error)) {
      return false;
    }

    throw error;
  }
}

function isMissingFileError(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
