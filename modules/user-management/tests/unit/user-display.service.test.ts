import { describe, expect, it, vi } from 'vitest';
import { formatLanguageLabel, languageLabelKey } from '../../services/user-display.service.js';

describe('languageLabelKey', () => {
  it('should return base language key for plain codes', () => {
    expect(languageLabelKey('ar')).toBe('user-management.language.ar');
    expect(languageLabelKey('en')).toBe('user-management.language.en');
  });

  it('should strip regional suffix from language codes', () => {
    expect(languageLabelKey('ar-EG')).toBe('user-management.language.ar');
    expect(languageLabelKey('en-US')).toBe('user-management.language.en');
    expect(languageLabelKey('pt-BR')).toBe('user-management.language.pt');
  });
});

describe('formatLanguageLabel', () => {
  it('should translate using the normalised key', () => {
    const i18n = {
      t: vi.fn((key: string) => (key === 'user-management.language.ar' ? 'العربية' : key)),
    };

    expect(formatLanguageLabel('ar-EG', i18n)).toBe('العربية');
    expect(i18n.t).toHaveBeenCalledWith('user-management.language.ar');
  });

  it('should pass through plain language codes correctly', () => {
    const i18n = {
      t: vi.fn((key: string) => (key === 'user-management.language.en' ? 'English' : key)),
    };

    expect(formatLanguageLabel('en', i18n)).toBe('English');
    expect(i18n.t).toHaveBeenCalledWith('user-management.language.en');
  });
});
