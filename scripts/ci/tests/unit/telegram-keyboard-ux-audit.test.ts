import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { auditTelegramKeyboardUx } from '../../telegram-keyboard-ux-audit.js';

function writeFixture(root: string, file: string, content: string): void {
  const fullPath = path.join(root, file);
  mkdirSync(path.dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, content);
}

interface LocaleFixtureInput {
  root: string;
  moduleName: string;
  ar: object;
  en: object;
}

function writeLocales(input: LocaleFixtureInput): void {
  writeFixture(input.root, `modules/${input.moduleName}/locales/ar.json`, JSON.stringify(input.ar));
  writeFixture(input.root, `modules/${input.moduleName}/locales/en.json`, JSON.stringify(input.en));
}

describe('auditTelegramKeyboardUx', () => {
  it('reports crowded rows, long labels, and missing locale keys', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'tempot-keyboard-ux-'));
    writeFixture(
      root,
      'modules/sample-module/menus/sample-menu.factory.ts',
      [
        "import { InlineKeyboard } from 'grammy';",
        'export function createMenu() {',
        '  return new InlineKeyboard()',
        "    .text(i18n.t('sample.first'), 'a')",
        "    .text(i18n.t('sample.second'), 'b')",
        "    .text(i18n.t('sample.third'), 'c')",
        "    .text(i18n.t('sample.fourth'), 'd')",
        '    .row()',
        "    .text(i18n.t('sample.long'), 'e')",
        "    .text(i18n.t('sample.missing'), 'f');",
        '}',
      ].join('\n'),
    );
    writeLocales({
      root,
      moduleName: 'sample-module',
      ar: {
        sample: {
          first: 'زر',
          second: 'زر',
          third: 'زر',
          fourth: 'زر',
          long: 'هذا زر طويل جدا وغير مناسب',
        },
      },
      en: {
        sample: {
          first: 'Button',
          second: 'Button',
          third: 'Button',
          fourth: 'Button',
          long: 'This button label is too long',
        },
      },
    });

    const violations = auditTelegramKeyboardUx({ repositoryRoot: root });

    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ message: 'Inline keyboard row has more than 3 buttons.' }),
        expect.objectContaining({ message: 'Arabic button label exceeds 20 characters.' }),
        expect.objectContaining({ message: 'English button label exceeds 24 characters.' }),
        expect.objectContaining({ message: 'Button locale key is missing in ar locale.' }),
        expect.objectContaining({ message: 'Button locale key is missing in en locale.' }),
      ]),
    );
  });

  it('accepts short labels and single-button rows', () => {
    const root = mkdtempSync(path.join(tmpdir(), 'tempot-keyboard-ux-'));
    writeFixture(
      root,
      'modules/sample-module/menus/sample-menu.factory.ts',
      [
        "import { InlineKeyboard } from 'grammy';",
        'export function createMenu() {',
        '  return new InlineKeyboard()',
        "    .text(i18n.t('sample.first'), 'a')",
        '    .row()',
        "    .text(i18n.t('sample.second'), 'b');",
        '}',
      ].join('\n'),
    );
    writeLocales({
      root,
      moduleName: 'sample-module',
      ar: { sample: { first: 'الأول', second: 'الثاني' } },
      en: { sample: { first: 'First', second: 'Second' } },
    });

    expect(auditTelegramKeyboardUx({ repositoryRoot: root })).toEqual([]);
  });
});
