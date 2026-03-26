import { describe, it, expect } from 'vitest';
import { FormatService } from '../../src/format.service.js';

describe('FormatService', () => {
  const service = new FormatService();

  describe('formatCurrency()', () => {
    it('should format currency correctly for Egypt (EGP)', () => {
      const result = service.formatCurrency(150.75, 'ar-EG', 'EGP');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        // Arabic-Eastern numerals for amount
        expect(result.value).toContain('\u0661\u0665\u0660');
        // Egyptian pound symbol
        expect(result.value).toContain('\u062c.\u0645.');
      }
    });

    it('should format currency for Saudi Arabia (SAR)', () => {
      const result = service.formatCurrency(150.75, 'ar-SA', 'SAR');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toContain('\u0661\u0665\u0660');
        expect(result.value).toContain('\u0631.\u0633.');
      }
    });

    it('should use default locale and currency when not specified', () => {
      const result = service.formatCurrency(100);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        // Default is ar-EG / EGP
        expect(result.value).toContain('\u062c.\u0645.');
      }
    });

    it('should return err for invalid currency code', () => {
      const result = service.formatCurrency(100, 'ar-EG', 'INVALID');
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe('regional.invalid_locale');
      }
    });
  });

  describe('formatNumber()', () => {
    it('should format number with locale-specific grouping', () => {
      const result = service.formatNumber(150000, 'ar-EG');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toContain('\u0661\u0665\u0660');
      }
    });

    it('should use default locale when not specified', () => {
      const result = service.formatNumber(1234);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(typeof result.value).toBe('string');
        expect(result.value.length).toBeGreaterThan(0);
      }
    });
  });

  describe('formatPercent()', () => {
    it('should format percentage', () => {
      const result = service.formatPercent(0.75, 'ar-EG');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toContain('\u0667\u0665');
        expect(result.value).toContain('\u066A');
      }
    });

    it('should use default locale when not specified', () => {
      const result = service.formatPercent(0.5);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(typeof result.value).toBe('string');
      }
    });
  });
});
