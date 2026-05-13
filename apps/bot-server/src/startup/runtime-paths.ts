import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export type RuntimeDirectoryName = 'modules' | 'packages' | 'specs';

const CURRENT_FILE_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = path.resolve(CURRENT_FILE_DIR, '../../../..');

export function resolveRuntimeDirectory(directory: RuntimeDirectoryName): string {
  const cwdCandidate = path.resolve(process.cwd(), directory);

  if (fs.existsSync(cwdCandidate)) {
    return cwdCandidate;
  }

  return path.resolve(REPOSITORY_ROOT, directory);
}
