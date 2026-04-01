import { describe, it, expect } from 'vitest';
import { detectHardcodedStrings, validateLocaleFiles } from '../../src/i18n.cms-validators.js';

describe('cms-check', () => {
  describe('detectHardcodedStrings', () => {
    it('should detect hardcoded Arabic strings in source code', () => {
      const source = `
        const msg = "مرحبا بالعالم";
        console.log(msg);
      `;

      const violations = detectHardcodedStrings(source, 'test.ts');
      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].file).toBe('test.ts');
      expect(violations[0].type).toBe('hardcoded-string');
    });

    it('should detect hardcoded English sentences in source code', () => {
      const source = `
        const errorMsg = "Something went wrong, please try again";
      `;

      const violations = detectHardcodedStrings(source, 'test.ts');
      expect(violations.length).toBeGreaterThan(0);
    });

    it('should NOT flag t() function calls', () => {
      const source = `
        import { t } from '@tempot/i18n-core';
        const msg = t('common.greeting');
      `;

      const violations = detectHardcodedStrings(source, 'test.ts');
      expect(violations.length).toBe(0);
    });

    it('should NOT flag technical strings (identifiers, URLs, regex)', () => {
      const source = `
        const API_URL = "https://api.example.com";
        const key = "userId";
        const pattern = "^[a-z]+$";
        const code = "i18n.locale_load_failed";
        const env = "NODE_ENV";
      `;

      const violations = detectHardcodedStrings(source, 'test.ts');
      expect(violations.length).toBe(0);
    });

    it('should NOT flag strings in locale JSON files', () => {
      const source = `{ "greeting": "مرحبا" }`;

      const violations = detectHardcodedStrings(source, 'modules/auth/locales/ar.json');
      expect(violations.length).toBe(0);
    });

    it('should NOT flag import paths and module specifiers', () => {
      const source = `
        import { t } from '@tempot/i18n-core';
        import path from 'node:path';
        const mod = require('./utils');
      `;

      const violations = detectHardcodedStrings(source, 'test.ts');
      expect(violations.length).toBe(0);
    });
  });

  describe('validateLocaleFiles', () => {
    it('should pass when target has all keys from source', () => {
      const source = { greeting: 'مرحبا', farewell: 'وداعا' };
      const target = { greeting: 'Hello', farewell: 'Goodbye' };

      const result = validateLocaleFiles(source, target, 'en.json');
      expect(result.isOk()).toBe(true);
    });

    it('should fail when target is missing keys from source', () => {
      const source = { greeting: 'مرحبا', farewell: 'وداعا' };
      const target = { greeting: 'Hello' };

      const result = validateLocaleFiles(source, target, 'en.json');
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe('i18n.locale_parity_failed');
      }
    });

    it('should fail when target has extra keys not in source', () => {
      const source = { greeting: 'مرحبا' };
      const target = { greeting: 'Hello', extra: 'Not in source' };

      const result = validateLocaleFiles(source, target, 'en.json');
      expect(result.isErr()).toBe(true);
    });

    it('should fail when target has invalid value types', () => {
      const source = { greeting: 'مرحبا' };
      const target = { greeting: 123 };

      const result = validateLocaleFiles(
        source,
        target as unknown as Record<string, unknown>,
        'en.json',
      );
      expect(result.isErr()).toBe(true);
    });
  });
});
