import { describe, expect, it } from 'vitest';
import { auditSourceConformance } from '../../source-conformance-audit.js';

describe('auditSourceConformance', () => {
  it('reports suppressions, non-English comments, and hardcoded Telegram text', () => {
    const findings = auditSourceConformance([
      {
        path: 'apps/bot-server/src/example.ts',
        content: [
          '// تعليق للمطور',
          '// eslint-disable-next-line no-console',
          'async function handler(ctx: { reply: (text: string) => Promise<void> }) {',
          "  await ctx.reply('Visible text');",
          '}',
        ].join('\n'),
      },
    ]);

    expect(findings).toEqual([
      expect.objectContaining({ ruleId: 'source.non_english_comment', line: 1 }),
      expect.objectContaining({ ruleId: 'source.suppression', line: 2 }),
      expect.objectContaining({ ruleId: 'source.hardcoded_user_text', line: 4 }),
    ]);
  });

  it('ignores tests and translated values', () => {
    const findings = auditSourceConformance([
      {
        path: 'apps/bot-server/tests/unit/example.test.ts',
        content: "ctx.reply('fixture text');",
      },
      {
        path: 'apps/bot-server/src/example.ts',
        content: "ctx.reply(t('bot-server.message'));",
      },
    ]);

    expect(findings).toEqual([]);
  });
});
