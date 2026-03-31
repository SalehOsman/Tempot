import { describe, it, expect } from 'vitest';
import {
  detectLanguage,
  validateLabel,
  getCharLimit,
  getRowLimit,
} from '../../src/keyboards/label.validator.js';

describe('detectLanguage', () => {
  it('should return "ar" for Arabic text', () => {
    expect(detectLanguage('مرحبا')).toBe('ar');
  });

  it('should return "en" for English text', () => {
    expect(detectLanguage('Hello')).toBe('en');
  });

  it('should skip leading emoji and detect language from first alpha char', () => {
    expect(detectLanguage('✅ مرحبا')).toBe('ar');
    expect(detectLanguage('✅ Hello')).toBe('en');
  });

  it('should return "en" for emoji-only text', () => {
    expect(detectLanguage('✅ ⭐')).toBe('en');
  });
});

describe('validateLabel', () => {
  it('should return ok for valid inline Arabic label', () => {
    const result = validateLabel('✅ إنشاء فاتورة', 'inline');
    expect(result.isOk()).toBe(true);
  });

  it('should return err for empty label', () => {
    const result = validateLabel('', 'inline');
    expect(result.isErr()).toBe(true);
  });

  it('should return err for Arabic inline label exceeding 20 chars', () => {
    const longArabic = '✅ ' + 'ع'.repeat(21);
    const result = validateLabel(longArabic, 'inline');
    expect(result.isErr()).toBe(true);
  });

  it('should return err for English inline label exceeding 24 chars', () => {
    const longEnglish = '✅ ' + 'A'.repeat(25);
    const result = validateLabel(longEnglish, 'inline');
    expect(result.isErr()).toBe(true);
  });

  it('should use reply limits for reply keyboard type', () => {
    const replyArabic = '✅ ' + 'ع'.repeat(16); // > 15
    const result = validateLabel(replyArabic, 'reply');
    expect(result.isErr()).toBe(true);
  });

  it('should allow emoji-only labels', () => {
    const result = validateLabel('✅', 'inline');
    expect(result.isOk()).toBe(true);
  });

  it('should return err for inline label without leading emoji', () => {
    const result = validateLabel('Save Invoice', 'inline');
    expect(result.isErr()).toBe(true);
  });

  it('should allow reply label without leading emoji', () => {
    const result = validateLabel('Save Invoice', 'reply');
    expect(result.isOk()).toBe(true);
  });

  it('should return err for inline label with tab before text (not an emoji)', () => {
    const result = validateLabel('\tSave Invoice', 'inline');
    expect(result.isErr()).toBe(true);
  });

  it('should return err for inline label with NBSP before text (not an emoji)', () => {
    const result = validateLabel('\u00A0Save Invoice', 'inline');
    expect(result.isErr()).toBe(true);
  });
});

describe('getCharLimit', () => {
  it('should return 20 for inline Arabic', () => {
    expect(getCharLimit('inline', 'ar')).toBe(20);
  });

  it('should return 24 for inline English', () => {
    expect(getCharLimit('inline', 'en')).toBe(24);
  });

  it('should return 15 for reply Arabic', () => {
    expect(getCharLimit('reply', 'ar')).toBe(15);
  });

  it('should return 18 for reply English', () => {
    expect(getCharLimit('reply', 'en')).toBe(18);
  });
});

describe('getRowLimit', () => {
  it('should return 3 for inline', () => {
    expect(getRowLimit('inline')).toBe(3);
  });

  it('should return 2 for reply', () => {
    expect(getRowLimit('reply')).toBe(2);
  });
});
