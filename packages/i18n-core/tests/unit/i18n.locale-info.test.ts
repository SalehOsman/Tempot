import { describe, it, expect } from 'vitest';
import { getLocaleInfo } from '../../src/i18n.locale-info.js';
import { sanitizeValue } from '../../src/i18n.sanitizer.js';

describe('Helpers & Sanitizer', () => {
  describe('getLocaleInfo', () => {
    it('should return rtl for Arabic', () => {
      expect(getLocaleInfo('ar')).toEqual({ lang: 'ar', dir: 'rtl' });
    });

    it('should return ltr for English', () => {
      expect(getLocaleInfo('en')).toEqual({ lang: 'en', dir: 'ltr' });
    });
  });

  describe('sanitizeValue', () => {
    it('should strip script tags from input', () => {
      const input = '<script>alert("xss")</script>Hello';
      expect(sanitizeValue(input)).toBe('Hello');
    });

    it('should allow safe tags', () => {
      const input = '<b>Hello</b>';
      expect(sanitizeValue(input)).toBe('<b>Hello</b>');
    });
  });
});
