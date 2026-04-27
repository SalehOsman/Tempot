import { describe, expect, it } from 'vitest';
import {
  extractNationalIdData,
  formatNationalId,
  getGovernorateName,
  isValidNationalId,
  parseNationalId,
  validateNationalId,
} from '../../src/index.js';

describe('@tempot/national-id-parser', () => {
  describe('parseNationalId', () => {
    it('should parse valid national ID', () => {
      const result = parseNationalId('28009010100332');

      expect(result.isValid).toBe(true);
      expect(result.gender).toBe('male');
      expect(result.governorate).toBe('eg.governorates.cairo');
      expect(result.governorateCode).toBe('01');
      expect(result.birthDate.getFullYear()).toBe(1980);
      expect(result.birthDate.getMonth()).toBe(8);
      expect(result.birthDate.getDate()).toBe(1);
    });

    it('should handle female national ID', () => {
      const result = parseNationalId('28009010100222');

      expect(result.isValid).toBe(true);
      expect(result.gender).toBe('female');
    });

    it('should handle invalid length', () => {
      const result = parseNationalId('123');

      expect(result.isValid).toBe(false);
    });

    it('should handle non-numeric input', () => {
      const result = parseNationalId('abc12345678901');

      expect(result.isValid).toBe(false);
    });

    it('should handle formatted input with spaces', () => {
      const result = parseNationalId('2800901 0100332');

      expect(result.isValid).toBe(true);
    });

    it('should handle formatted input with dashes', () => {
      const result = parseNationalId('2800901-0100332');

      expect(result.isValid).toBe(true);
    });
  });

  describe('extractNationalIdData', () => {
    it('should extract data from valid national ID', () => {
      const result = extractNationalIdData('28009010100332');

      expect(result).not.toBeNull();
      expect(result?.gender).toBe('male');
      expect(result?.governorate).toBe('eg.governorates.cairo');
      expect(result?.birthDate.getFullYear()).toBe(1980);
    });

    it('should return null for invalid national ID', () => {
      const result = extractNationalIdData('123');

      expect(result).toBeNull();
    });
  });

  describe('formatNationalId', () => {
    it('should format valid national ID', () => {
      const result = formatNationalId('28009010100332');

      expect(result).toBe('2800901-0100332');
    });

    it('should handle already formatted input', () => {
      const result = formatNationalId('2800901-0100332');

      expect(result).toBe('2800901-0100332');
    });

    it('should return original for invalid length', () => {
      const result = formatNationalId('123');

      expect(result).toBe('123');
    });
  });

  describe('getGovernorateName', () => {
    it('should return governorate i18n key for valid code', () => {
      const result = getGovernorateName('01');

      expect(result).toBe('eg.governorates.cairo');
    });

    it('should handle single digit code', () => {
      const result = getGovernorateName('1');

      expect(result).toBe('eg.governorates.cairo');
    });

    it('should return empty string for invalid code', () => {
      const result = getGovernorateName('99');

      expect(result).toBe('');
    });
  });

  describe('validateNationalId', () => {
    it('should validate correct national ID', () => {
      const result = validateNationalId('28009010100332');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty input', () => {
      const result = validateNationalId('');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('nationalId.validation.empty');
    });

    it('should reject invalid length', () => {
      const result = validateNationalId('123');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('nationalId.validation.invalidLength');
    });

    it('should reject non-numeric input', () => {
      const result = validateNationalId('abc12345678901');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('nationalId.validation.nonNumeric');
    });

    it('should reject invalid century code', () => {
      const result = validateNationalId('18009010100332');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('nationalId.validation.invalidCentury');
    });

    it('should reject invalid month', () => {
      const result = validateNationalId('28013010100332');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('nationalId.validation.invalidMonth');
    });

    it('should reject invalid day', () => {
      const result = validateNationalId('28009320100332');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('nationalId.validation.invalidDay');
    });

    it('should reject invalid governorate code', () => {
      const result = validateNationalId('28009019900332');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('nationalId.validation.invalidGovernorate');
    });
  });

  describe('isValidNationalId', () => {
    it('should return true for valid national ID', () => {
      const result = isValidNationalId('28009010100332');

      expect(result).toBe(true);
    });

    it('should return false for invalid national ID', () => {
      const result = isValidNationalId('123');

      expect(result).toBe(false);
    });
  });
});
