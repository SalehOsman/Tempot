import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadAllowlist } from '../../lib/allowlist-loader.js';
import { auditStaleArtifacts } from '../../stale-artifacts-audit.js';

function writeFixture(root: string, file: string, content: string): void {
  const fullPath = path.join(root, file);
  mkdirSync(path.dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, content);
}

describe('auditStaleArtifacts', () => {
  it('reports stale JavaScript files in src and empty module utils directories', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'tempot-stale-artifacts-'));
    mkdirSync(path.join(root, 'modules', 'demo', 'utils'), { recursive: true });
    mkdirSync(path.join(root, 'modules', 'ok', 'utils'), { recursive: true });
    writeFixture(root, 'apps/demo/src/stale.js', 'export {};\n');
    writeFixture(root, 'modules/ok/utils/index.ts', 'export {};\n');
    writeFixture(root, 'allowlist.json', JSON.stringify({ staleArtifacts: { entries: [] } }));

    const allowlist = loadAllowlist({
      repositoryRoot: root,
      allowlistPath: path.join(root, 'allowlist.json'),
      today: '2026-07-11',
    });

    expect(auditStaleArtifacts({ repositoryRoot: root, allowlist })).toEqual([
      expect.objectContaining({ file: 'apps/demo/src/stale.js', rule: 'Rule LXXVIII' }),
      expect.objectContaining({ file: 'modules/demo/utils/', rule: 'Rule VIII' }),
    ]);
  });
});
