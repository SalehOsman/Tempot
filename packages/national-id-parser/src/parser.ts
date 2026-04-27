import type { Gender, NationalIdData } from './types.js';
import { isValidNationalId } from './validators.js';

const GOVERNORATE_KEYS: Record<string, string> = {
  '01': 'eg.governorates.cairo',
  '02': 'eg.governorates.alexandria',
  '03': 'eg.governorates.portSaid',
  '04': 'eg.governorates.suez',
  '05': 'eg.governorates.damietta',
  '06': 'eg.governorates.dakahlia',
  '07': 'eg.governorates.sharqia',
  '08': 'eg.governorates.monufia',
  '09': 'eg.governorates.gharbia',
  '10': 'eg.governorates.giza',
  '11': 'eg.governorates.ismailia',
  '12': 'eg.governorates.beniSuef',
  '13': 'eg.governorates.faiyum',
  '14': 'eg.governorates.minya',
  '15': 'eg.governorates.asyut',
  '16': 'eg.governorates.sohag',
  '17': 'eg.governorates.qena',
  '18': 'eg.governorates.aswan',
  '19': 'eg.governorates.luxor',
  '20': 'eg.governorates.redSea',
  '21': 'eg.governorates.newValley',
  '22': 'eg.governorates.matrouh',
  '23': 'eg.governorates.northSinai',
  '24': 'eg.governorates.southSinai',
  '25': 'eg.governorates.qalyubia',
  '26': 'eg.governorates.kafrElSheikh',
  '27': 'eg.governorates.gharbia',
  '28': 'eg.governorates.beheira',
  '29': 'eg.governorates.ismailia',
  '30': 'eg.governorates.giza',
};

export function parseNationalId(nationalId: string): NationalIdData {
  const cleaned = nationalId.replace(/[\s-]/g, '');

  if (!isValidNationalId(cleaned)) {
    return createInvalidResult();
  }

  try {
    const centuryCode = cleaned[0];
    const yearCode = cleaned.substring(1, 3);
    const fullYear = parseYear(centuryCode, yearCode);

    const monthCode = cleaned.substring(3, 5);
    const month = parseInt(monthCode, 10);

    const dayCode = cleaned.substring(5, 7);
    const day = parseInt(dayCode, 10);

    const birthDate = new Date(parseInt(fullYear, 10), month - 1, day);

    if (isNaN(birthDate.getTime())) {
      return createInvalidResult();
    }

    const governorateCode = cleaned.substring(7, 9);
    const governorate = GOVERNORATE_KEYS[governorateCode] || '';

    const genderDigit = parseInt(cleaned[12], 10);
    const gender = parseGender(genderDigit);

    return {
      gender,
      birthDate,
      governorate,
      governorateCode,
      isValid: true,
    };
  } catch {
    return createInvalidResult();
  }
}

export function extractNationalIdData(nationalId: string): {
  gender: Gender;
  birthDate: Date;
  governorate: string;
} | null {
  const data = parseNationalId(nationalId);

  if (!data.isValid) {
    return null;
  }

  return {
    gender: data.gender,
    birthDate: data.birthDate,
    governorate: data.governorate,
  };
}

export function formatNationalId(nationalId: string): string {
  const cleaned = nationalId.replace(/[\s-]/g, '');
  if (cleaned.length !== 14) {
    return cleaned;
  }
  return `${cleaned.substring(0, 7)}-${cleaned.substring(7)}`;
}

export function getGovernorateName(code: string): string {
  const paddedCode = code.padStart(2, '0');
  return GOVERNORATE_KEYS[paddedCode] || '';
}

function parseGender(sequentialLastDigit: number): Gender {
  return sequentialLastDigit % 2 === 1 ? 'male' : 'female';
}

function parseYear(centuryCode: string, yearCode: string): string {
  return centuryCode === '2' ? `19${yearCode}` : `20${yearCode}`;
}

function createInvalidResult(): NationalIdData {
  return {
    gender: 'male',
    birthDate: new Date(),
    governorate: '',
    governorateCode: '',
    isValid: false,
  };
}
