import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { afterEach, describe, expect, it, vi } from 'vitest';

interface SetupContentLinkOptions {
  linkPath: string;
  targetPath: string;
  logger: (level: string, message: string) => void;
}

const require = createRequire(import.meta.url);

const { ensureContentLink } = require('../../scripts/setup-content-link.cjs') as {
  ensureContentLink: (options: SetupContentLinkOptions) => void;
};

describe('setup content link', () => {
  const tempRoots: string[] = [];

  afterEach(() => {
    for (const root of tempRoots.splice(0)) {
      rmSync(root, { force: true, recursive: true });
    }
  });

  function createTempRoot(): string {
    const root = mkdtempSync(join(tmpdir(), 'tempot-docs-link-'));
    tempRoots.push(root);
    return root;
  }

  it('accepts a Docker-expanded docs directory when it matches the source content', () => {
    const root = createTempRoot();
    const targetPath = join(root, 'docs', 'product');
    const linkPath = join(root, 'apps', 'docs', 'src', 'content', 'docs');
    const logger = vi.fn();

    mkdirSync(join(targetPath, 'en', 'guides'), { recursive: true });
    writeFileSync(join(targetPath, 'en', 'guides', 'shared.md'), '# Shared\n');

    mkdirSync(join(linkPath, 'en', 'guides'), { recursive: true });
    writeFileSync(join(linkPath, 'en', 'guides', 'shared.md'), '# Shared\n');

    ensureContentLink({ linkPath, targetPath, logger });

    expect(logger).toHaveBeenCalledWith(
      'info',
      'Directory already mirrors docs/product; keeping Docker-expanded content.',
    );
  });
});
