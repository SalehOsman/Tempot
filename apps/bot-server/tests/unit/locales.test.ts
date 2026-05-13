import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const requiredRuntimeKeys = [
  'bot-server.error_message',
  'input-engine.actions.cancel',
  'input-engine.errors.short-text',
  'input-engine.confirmation.confirm',
  'input-engine.ai.unavailable',
];

function readLocale(lang: 'ar' | 'en'): Record<string, string> {
  const url = new URL(`../../locales/${lang}.json`, import.meta.url);
  return JSON.parse(readFileSync(url, 'utf-8')) as Record<string, string>;
}

describe('bot-server runtime locale coverage', () => {
  it('includes shared runtime keys used by bot-server and input-engine', () => {
    const ar = readLocale('ar');
    const en = readLocale('en');

    for (const key of requiredRuntimeKeys) {
      expect(ar[key]).toBeTypeOf('string');
      expect(en[key]).toBeTypeOf('string');
      expect(ar[key]).not.toBe(key);
      expect(en[key]).not.toBe(key);
    }
  });
});
