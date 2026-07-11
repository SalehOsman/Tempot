import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { auditEslintDisable } from '../../eslint-disable-audit.js';
import { loadAllowlist } from '../../lib/allowlist-loader.js';

function writeFixture(root: string, file: string, content: string): void {
  const fullPath = path.join(root, file);
  mkdirSync(path.dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, content);
}

describe('auditEslintDisable', () => {
  it('reports eslint-disable directives outside tests', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'tempot-eslint-disable-'));
    mkdirSync(path.join(root, 'specs', '060-workspace-cleanup'), { recursive: true });
    writeFixture(root, 'scripts/blocked.ts', '/* eslint-disable no-console */\n');
    writeFixture(root, 'scripts/pattern.ts', 'const pattern = /eslint-disable/;\n');
    writeFixture(root, 'scripts/tests/allowed.test.ts', '/* eslint-disable no-console */\n');
    writeFixture(root, 'allowlist.json', JSON.stringify({ eslintDisable: { entries: [] } }));

    const allowlist = loadAllowlist({
      repositoryRoot: root,
      allowlistPath: path.join(root, 'allowlist.json'),
      today: '2026-07-11',
    });

    expect(auditEslintDisable({ repositoryRoot: root, allowlist })).toEqual([
      expect.objectContaining({ file: 'scripts/blocked.ts', rule: 'Rule I' }),
    ]);
  });

  it('honors allowlisted eslint-disable debt', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'tempot-eslint-disable-'));
    mkdirSync(path.join(root, 'specs', '060-workspace-cleanup'), { recursive: true });
    writeFixture(root, 'scripts/blocked.ts', '/* eslint-disable no-console */\n');
    writeFixture(
      root,
      'allowlist.json',
      JSON.stringify({
        eslintDisable: {
          entries: [
            {
              pattern: 'scripts/blocked.ts',
              reason: 'Existing eslint-disable debt scheduled for cleanup.',
              added_at: '2026-06-23',
              expires_at: '2026-09-21',
              owner_spec: '060-workspace-cleanup',
            },
          ],
        },
      }),
    );

    const allowlist = loadAllowlist({
      repositoryRoot: root,
      allowlistPath: path.join(root, 'allowlist.json'),
      today: '2026-07-11',
    });

    expect(auditEslintDisable({ repositoryRoot: root, allowlist })).toEqual([]);
  });
});
