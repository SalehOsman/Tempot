/**
 * File reading, directory scanning, and check-result construction
 * for the spec-validate script.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as process from 'node:process';

import type { CheckDetail, CheckId, CheckResult } from './types.js';
import { SEVERITY_MAP } from './types.js';

export function stderr(msg: string): void {
  process.stderr.write(msg);
}

export function readFileOr(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

export function readFileLinesOr(filePath: string): string[] | null {
  const content = readFileOr(filePath);
  if (content === null) return null;
  return content.split('\n');
}

/**
 * Derives the packages/{name} directory from a spec directory name.
 * `004-session-manager-package` -> `session-manager`
 */
export function specDirToPackageName(specDir: string): string {
  return specDir.replace(/^\d{3}-/, '').replace(/-package$/, '');
}

/**
 * Recursively grep a directory for a pattern and return matching file paths.
 */
export function grepDir(dir: string, pattern: RegExp): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  function walk(currentDir: string): void {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === 'dist') continue;
        walk(fullPath);
      } else if (entry.isFile() && /\.(ts|js|json)$/.test(entry.name)) {
        const content = readFileOr(fullPath);
        if (content !== null && pattern.test(content)) {
          results.push(fullPath);
        }
      }
    }
  }
  walk(dir);
  return results;
}

export function makeCheck(id: CheckId, details: CheckDetail[]): CheckResult {
  return {
    id,
    status: details.length === 0 ? 'PASS' : 'FAIL',
    severity: SEVERITY_MAP[id],
    details,
  };
}
