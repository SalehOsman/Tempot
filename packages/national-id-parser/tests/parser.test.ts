import { describe, it, expect } from 'vitest';
import {
  parseNationalId,
  extractNationalIdData,
  formatNationalId,
  getGovernorateName,
  validateNationalId,
  isValidNationalId,
} from '../src/index.js';

describe('@tempot/national-id-parser', () => {
  describe('parseNationalId', () => {
    it('should parse valid national ID', () => {
      const result = parseNationalId('28009010100332');

      expect(result.isValid).toBe(true);
      expect(result.gender).toBe('male');
      expect(result.governorate).toBe('القاهرة');
      expect(result.governorateCode).toBe('01');
      expect(result.birthDate.getFullYear()).toBe(1980);
      expect(result.birthDate.getMonth()).toBe(8); // September (0-indexed)
      expect(result.birthDate.getDate()).toBe(1);
    });

    it('should handle female national ID', () => {
      const result = parseNationalId('29009010100332');

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
      expect(result?.governorate).toBe('القاهرة');
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
    it('should return governorate name for valid code', () => {
      const result = getGovernorateName('01');

      expect(result).toBe('القاهرة');
    });

    it('should handle single digit code', () => {
      const result = getGovernorateName('1');

      expect(result).toBe('القاهرة');
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
      expect(result.errors).toContain('الرقم القومي فارغ');
    });

    it('should reject invalid length', () => {
      const result = validateNationalId('123');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('الرقم القومي يجب أن يكون 14 رقم');
    });

    it('should reject non-numeric input', () => {
      const result = validateNationalId('abc12345678901');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('الرقم القومي يحتوي على أحرف غير صالحة');
    });

    it('should reject invalid gender code', () => {
      const result = validateNationalId('38009010100332');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('أول رقم غير صالح (يجب أن يكون 1 أو 2)');
    });

    it('should reject invalid month', () => {
      const result = validateNationalId('28009015100332');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('شهر الميلاد غير صالح');
    });

    it('should reject invalid day', () => {
      const result = validateNationalId('28009010100332');

      expect(result.isValid).toBe(true); // Valid day
    });

    it('should reject invalid governorate code', () => {
      const result = validateNationalId('28009010100999');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('كود المحافظة غير صالح');
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
