import { execFileSync } from 'node:child_process';
import { posix } from 'node:path';

import ts from 'typescript';

import type { TrackedSourceFile } from './import-boundary-audit.js';

export function collectTrackedSourceFiles(cwd: string): TrackedSourceFile[] {
  const output = execFileSync('git', ['ls-files', '*.ts', '*.tsx'], {
    cwd,
    encoding: 'utf8',
  });

  return output
    .split(/\r?\n/)
    .filter((path) => path.length > 0)
    .filter((path) => !path.endsWith('.d.ts'))
    .map((path) => ({
      path: normalizePath(path),
      content: ts.sys.readFile(posix.join(cwd.replace(/\\/g, '/'), path)) ?? '',
    }));
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\.\//, '');
}
