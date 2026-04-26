/**
 * وظائف التحقق من صحة الرقم القومي المصري
 */

import type { ValidationResult } from './types.js';

/**
 * التحقق من صحة الرقم القومي المصري
 *
 * @param nationalId - الرقم القومي المصري
 * @returns نتيجة التحقق مع قائمة الأخطاء
 */
export function validateNationalId(nationalId: string): ValidationResult {
  const errors: string[] = [];
  const cleaned = nationalId.replace(/[\s-]/g, '');

  if (cleaned.length === 0) {
    return {
      isValid: false,
      errors: ['الرقم القومي فارغ'],
    };
  }

  validateLength(cleaned, errors);
  validateDigits(cleaned, errors);

  if (errors.length > 0) {
    return {
      isValid: false,
      errors,
    };
  }

  validateGenderCode(cleaned, errors);
  validateBirthDate(cleaned, errors);
  validateGovernorateCode(cleaned, errors);

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function validateLength(cleaned: string, errors: string[]): void {
  if (cleaned.length !== 14) {
    errors.push('الرقم القومي يجب أن يكون 14 رقم');
  }
}

function validateDigits(cleaned: string, errors: string[]): void {
  if (!/^\d+$/.test(cleaned)) {
    errors.push('الرقم القومي يحتوي على أحرف غير صالحة');
  }
}

function validateGenderCode(cleaned: string, errors: string[]): void {
  const genderCode = cleaned[0];
  if (genderCode !== '1' && genderCode !== '2') {
    errors.push('أول رقم غير صالح (يجب أن يكون 1 أو 2)');
  }
}

function validateBirthDate(cleaned: string, errors: string[]): void {
  const yearCode = cleaned.substring(1, 3);
  const year = parseInt(yearCode, 10);
  if (isNaN(year) || year < 0 || year > 99) {
    errors.push('سنة الميلاد غير صالحة');
  }

  const monthCode = cleaned.substring(3, 5);
  const month = parseInt(monthCode, 10);
  if (isNaN(month) || month < 1 || month > 12) {
    errors.push('شهر الميلاد غير صالح');
  }

  const dayCode = cleaned.substring(5, 7);
  const day = parseInt(dayCode, 10);
  if (isNaN(day) || day < 1 || day > 31) {
    errors.push('يوم الميلاد غير صالح');
  }
}

function validateGovernorateCode(cleaned: string, errors: string[]): void {
  const governorateCode = cleaned.substring(7, 9);
  const validGovernorateCodes = [
    '01', '02', '03', '04', '05', '06', '07', '08', '09', '10',
    '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
    '21', '22', '23', '24', '25', '26', '27', '28', '29', '30',
  ];
  if (!validGovernorateCodes.includes(governorateCode)) {
    errors.push('كود المحافظة غير صالح');
  }
}

/**
 * التحقق السريع من صحة الرقم القومي
 *
 * @param nationalId - الرقم القومي المصري
 * @returns true إذا كان الرقم صالحاً، false خلاف ذلك
 */
export function isValidNationalId(nationalId: string): boolean {
  const result = validateNationalId(nationalId);
  return result.isValid;
}
