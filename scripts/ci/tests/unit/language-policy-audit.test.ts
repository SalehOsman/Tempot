import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { auditLanguagePolicy } from '../../language-policy-audit.js';
import { loadAllowlist } from '../../lib/allowlist-loader.js';

function writeFixture(root: string, file: string, content: string): void {
  const fullPath = path.join(root, file);
  mkdirSync(path.dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, content);
}

function createRepository(): string {
  const root = mkdtempSync(path.join(tmpdir(), 'tempot-language-policy-'));
  mkdirSync(path.join(root, 'specs', '061-arabic-docs-translation-or-removal'), {
    recursive: true,
  });
  writeFixture(root, 'docs/arabic.md', '# عنوان عربي\n');
  writeFixture(root, 'docs/english.md', '# English title\n');
  writeFixture(root, 'apps/demo/src/comment.ts', '// تعليق عربي\n');
  writeFixture(root, 'apps/demo/src/string.ts', "const label = 'نص عربي';\n");
  writeFixture(root, 'apps/demo/tests/unit/fixture.test.ts', "const input = 'نص عربي';\n");
  writeFixture(root, 'apps/demo/locales/ar.json', '{"title":"عنوان عربي"}\n');
  return root;
}

describe('auditLanguagePolicy', () => {
  it('reports Arabic in docs, comments, and non-test strings', () => {
    const root = createRepository();
    const allowlistPath = path.join(root, 'allowlist.json');
    writeFixture(root, 'allowlist.json', JSON.stringify({ languagePolicy: { entries: [] } }));
    const allowlist = loadAllowlist({
      repositoryRoot: root,
      allowlistPath,
      today: '2026-07-11',
    });

    const findings = auditLanguagePolicy({ repositoryRoot: root, allowlist });

    expect(findings.map((finding) => finding.file)).toEqual([
      'apps/demo/src/comment.ts',
      'apps/demo/src/string.ts',
      'docs/arabic.md',
    ]);
  });

  it('honors allowlisted Arabic docs', () => {
    const root = createRepository();
    const allowlistPath = path.join(root, 'allowlist.json');
    writeFixture(
      root,
      'allowlist.json',
      JSON.stringify({
        languagePolicy: {
          entries: [
            {
              pattern: 'docs/arabic.md',
              reason: 'Existing Arabic document scheduled for translation.',
              added_at: '2026-06-23',
              expires_at: '2026-09-21',
              owner_spec: '061-arabic-docs-translation-or-removal',
            },
          ],
        },
      }),
    );

    const allowlist = loadAllowlist({ repositoryRoot: root, allowlistPath, today: '2026-07-11' });
    const findings = auditLanguagePolicy({ repositoryRoot: root, allowlist });

    expect(findings.map((finding) => finding.file)).not.toContain('docs/arabic.md');
  });
});
