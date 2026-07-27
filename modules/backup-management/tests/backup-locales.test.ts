import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const localePaths = ['../locales/en.json', '../locales/ar.json'] as const;
const menuKeys = [
  'button',
  'request',
  'history',
  'restore',
  'retention',
  'production_restore',
  'confirm_production_restore',
  'factory_reset',
  'confirm_factory_reset',
  'back',
] as const;

interface BackupLocale {
  'backup-management': {
    menu: Record<(typeof menuKeys)[number], string>;
  };
}

function readLocale(relativePath: string): BackupLocale {
  const path = new URL(relativePath, import.meta.url);
  return JSON.parse(readFileSync(path, 'utf-8')) as BackupLocale;
}

function startsWithIcon(value: string): boolean {
  return /^[^\p{Letter}\p{Number}\s]/u.test(value);
}

describe('backup-management locales', () => {
  it.each(localePaths)('should render icon-led compact menu labels in %s', (localePath) => {
    const menu = readLocale(localePath)['backup-management'].menu;

    for (const key of menuKeys) {
      expect(startsWithIcon(menu[key])).toBe(true);
      expect(Array.from(menu[key]).length).toBeLessThanOrEqual(24);
      expect(menu[key]).not.toContain('?');
    }
  });
});
