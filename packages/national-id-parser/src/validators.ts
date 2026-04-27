import type { NationalIdValidationErrorCode, ValidationResult } from './types.js';

export const NATIONAL_ID_VALIDATION_ERRORS = {
  empty: 'nationalId.validation.empty',
  invalidLength: 'nationalId.validation.invalidLength',
  nonNumeric: 'nationalId.validation.nonNumeric',
  invalidCentury: 'nationalId.validation.invalidCentury',
  invalidYear: 'nationalId.validation.invalidYear',
  invalidMonth: 'nationalId.validation.invalidMonth',
  invalidDay: 'nationalId.validation.invalidDay',
  invalidGovernorate: 'nationalId.validation.invalidGovernorate',
} as const satisfies Record<string, NationalIdValidationErrorCode>;

export function validateNationalId(nationalId: string): ValidationResult {
  const errors: NationalIdValidationErrorCode[] = [];
  const cleaned = nationalId.replace(/[\s-]/g, '');

  if (cleaned.length === 0) {
    return {
      isValid: false,
      errors: [NATIONAL_ID_VALIDATION_ERRORS.empty],
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

  validateCenturyCode(cleaned, errors);
  validateBirthDate(cleaned, errors);
  validateGovernorateCode(cleaned, errors);

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function validateLength(cleaned: string, errors: NationalIdValidationErrorCode[]): void {
  if (cleaned.length !== 14) {
    errors.push(NATIONAL_ID_VALIDATION_ERRORS.invalidLength);
  }
}

function validateDigits(cleaned: string, errors: NationalIdValidationErrorCode[]): void {
  if (!/^\d+$/.test(cleaned)) {
    errors.push(NATIONAL_ID_VALIDATION_ERRORS.nonNumeric);
  }
}

function validateCenturyCode(cleaned: string, errors: NationalIdValidationErrorCode[]): void {
  const centuryCode = cleaned[0];
  if (centuryCode !== '2' && centuryCode !== '3') {
    errors.push(NATIONAL_ID_VALIDATION_ERRORS.invalidCentury);
  }
}

function validateBirthDate(cleaned: string, errors: NationalIdValidationErrorCode[]): void {
  const yearCode = cleaned.substring(1, 3);
  const year = parseInt(yearCode, 10);
  if (isNaN(year) || year < 0 || year > 99) {
    errors.push(NATIONAL_ID_VALIDATION_ERRORS.invalidYear);
  }

  const monthCode = cleaned.substring(3, 5);
  const month = parseInt(monthCode, 10);
  if (isNaN(month) || month < 1 || month > 12) {
    errors.push(NATIONAL_ID_VALIDATION_ERRORS.invalidMonth);
  }

  const dayCode = cleaned.substring(5, 7);
  const day = parseInt(dayCode, 10);
  if (isNaN(day) || day < 1 || day > 31) {
    errors.push(NATIONAL_ID_VALIDATION_ERRORS.invalidDay);
  }
}

function validateGovernorateCode(cleaned: string, errors: NationalIdValidationErrorCode[]): void {
  const governorateCode = cleaned.substring(7, 9);
  const validGovernorateCodes = [
    '01',
    '02',
    '03',
    '04',
    '05',
    '06',
    '07',
    '08',
    '09',
    '10',
    '11',
    '12',
    '13',
    '14',
    '15',
    '16',
    '17',
    '18',
    '19',
    '20',
    '21',
    '22',
    '23',
    '24',
    '25',
    '26',
    '27',
    '28',
    '29',
    '30',
  ];
  if (!validGovernorateCodes.includes(governorateCode)) {
    errors.push(NATIONAL_ID_VALIDATION_ERRORS.invalidGovernorate);
  }
}

export function isValidNationalId(nationalId: string): boolean {
  const result = validateNationalId(nationalId);
  return result.isValid;
}
