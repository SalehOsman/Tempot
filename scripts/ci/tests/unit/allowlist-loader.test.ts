import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadAllowlist } from '../../lib/allowlist-loader.js';

function createRepository(): string {
  const root = mkdtempSync(path.join(tmpdir(), 'tempot-allowlist-'));
  mkdirSync(path.join(root, 'docs'), { recursive: true });
  mkdirSync(path.join(root, 'specs', '060-workspace-cleanup'), { recursive: true });
  writeFileSync(path.join(root, 'docs', 'arabic.md'), '# Existing debt\n');
  return root;
}

describe('loadAllowlist', () => {
  it('loads valid entries and returns category-specific matches', () => {
    const root = createRepository();
    const allowlistPath = path.join(root, 'allowlist.json');
    writeFileSync(
      allowlistPath,
      JSON.stringify({
        languagePolicy: {
          entries: [
            {
              pattern: 'docs/arabic.md',
              reason: 'Existing documented debt owned by a cleanup spec.',
              added_at: '2026-06-23',
              expires_at: '2026-09-21',
              owner_spec: '060-workspace-cleanup',
            },
          ],
        },
        staleArtifacts: { entries: [] },
        eslintDisable: { entries: [] },
      }),
    );

    const allowlist = loadAllowlist({ repositoryRoot: root, allowlistPath, today: '2026-07-11' });

    expect(allowlist.meta.violations).toEqual([]);
    expect(allowlist.isAllowed('languagePolicy', 'docs/arabic.md')).toBe(true);
    expect(allowlist.isAllowed('eslintDisable', 'docs/arabic.md')).toBe(false);
  });

  it('reports expired and dangling entries', () => {
    const root = createRepository();
    const allowlistPath = path.join(root, 'allowlist.json');
    writeFileSync(
      allowlistPath,
      JSON.stringify({
        languagePolicy: {
          entries: [
            {
              pattern: 'docs/missing.md',
              reason: 'Missing stale entry should be reported by meta lint.',
              added_at: '2026-01-01',
              expires_at: '2026-01-31',
              owner_spec: '060-workspace-cleanup',
            },
          ],
        },
      }),
    );

    const allowlist = loadAllowlist({ repositoryRoot: root, allowlistPath, today: '2026-07-11' });

    expect(allowlist.meta.violations.map((violation) => violation.message)).toEqual([
      'Allowlist pattern does not match any file.',
      'Allowlist entry is expired.',
    ]);
  });
});
