import { describe, it, expect } from 'vitest';
import { i18nConfig } from '../../src/i18n.config';

describe('i18n Configuration', () => {
  it('should have Arabic as primary and English as secondary language', () => {
    expect(i18nConfig.lng).toBe('ar');
    expect(i18nConfig.fallbackLng).toBe('en');
    expect(i18nConfig.supportedLngs).toEqual(['ar', 'en']);
  });
});
