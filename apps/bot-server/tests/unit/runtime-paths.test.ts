import { afterEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { resolveRuntimeDirectory } from '../../src/startup/runtime-paths.js';

describe('resolveRuntimeDirectory', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should prefer the current working directory when the requested runtime directory exists there', () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'tempot-runtime-paths-'));
    const modulesDir = path.join(cwd, 'modules');
    fs.mkdirSync(modulesDir);
    vi.spyOn(process, 'cwd').mockReturnValue(cwd);

    expect(resolveRuntimeDirectory('modules')).toBe(modulesDir);

    fs.rmSync(cwd, { recursive: true, force: true });
  });

  it('should fall back to the repository runtime directory when filtered package execution changes cwd', () => {
    const packageCwd = path.resolve('apps', 'bot-server');
    const repositoryRoot = path.resolve(__dirname, '../../../..');
    vi.spyOn(process, 'cwd').mockReturnValue(packageCwd);

    expect(resolveRuntimeDirectory('modules')).toBe(path.join(repositoryRoot, 'modules'));
    expect(resolveRuntimeDirectory('packages')).toBe(path.join(repositoryRoot, 'packages'));
    expect(resolveRuntimeDirectory('runtime')).toBe(path.join(repositoryRoot, 'runtime'));
    expect(resolveRuntimeDirectory('specs')).toBe(path.join(repositoryRoot, 'specs'));
  });
});
