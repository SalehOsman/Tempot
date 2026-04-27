/**
 * منطق استخراج البيانات من الرقم القومي المصري
 */

import type { NationalIdData, Gender } from './types.js';

const GOVERNORATE_CODES: Record<string, string> = {
  '01': 'القاهرة',
  '02': 'الإسكندرية',
  '03': 'بورسعيد',
  '04': 'السويس',
  '05': 'دمياط',
  '06': 'الدقهلية',
  '07': 'الشرقية',
  '08': 'المنوفية',
  '09': 'الغربية',
  '10': 'الجيزة',
  '11': 'الإسماعيلية',
  '12': 'بني سويف',
  '13': 'الفيوم',
  '14': 'المنيا',
  '15': 'أسيوط',
  '16': 'سوهاج',
  '17': 'قنا',
  '18': 'أسوان',
  '19': 'الأقصر',
  '20': 'البحر الأحمر',
  '21': 'الوادي الجديد',
  '22': 'مطروح',
  '23': 'شمال سيناء',
  '24': 'جنوب سيناء',
  '25': 'القليوبية',
  '26': 'كفر الشيخ',
  '27': 'الغربية',
  '28': 'البحيرة',
  '29': 'الإسماعيلية',
  '30': 'الجيزة',
};

/**
 * استخراج البيانات من الرقم القومي المصري
 *
 * @param nationalId - الرقم القومي المصري (14 رقم)
 * @returns البيانات المستخرجة مع صحة الرقم
 */
export function parseNationalId(nationalId: string): NationalIdData {
  const cleaned = nationalId.replace(/[\s-]/g, '');

  if (cleaned.length !== 14) {
    return createInvalidResult();
  }

  if (!/^\d{14}$/.test(cleaned)) {
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
    const governorate = GOVERNORATE_CODES[governorateCode] || '';

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

/**
 * استخراج البيانات فقط (بدون التحقق)
 *
 * @param nationalId - الرقم القومي المصري
 * @returns البيانات المستخرجة أو null إذا كان الرقم غير صالح
 */
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

/**
 * تنسيق الرقم القومي (مع شرطات)
 *
 * @param nationalId - الرقم القومي المصري
 * @returns الرقم القومي منسقاً (مثال: 2800901-0100332)
 */
export function formatNationalId(nationalId: string): string {
  const cleaned = nationalId.replace(/[\s-]/g, '');
  if (cleaned.length !== 14) {
    return cleaned;
  }
  return `${cleaned.substring(0, 7)}-${cleaned.substring(7)}`;
}

/**
 * الحصول على اسم المحافظة من الكود
 *
 * @param code - كود المحافظة (2 رقم)
 * @returns اسم المحافظة أو سلسلة فارغة إذا لم يتم العثور
 */
export function getGovernorateName(code: string): string {
  const paddedCode = code.padStart(2, '0');
  return GOVERNORATE_CODES[paddedCode] || '';
}

/**
 * تحديد الجنس من آخر رقم في الرقم التسلسلي (فردي=ذكر، زوجي=أنثى)
 */
function parseGender(sequentialLastDigit: number): Gender {
  return sequentialLastDigit % 2 === 1 ? 'male' : 'female';
}

/**
 * تحديد السنة الكاملة من أول رقمين
 */
function parseYear(centuryCode: string, yearCode: string): string {
  return centuryCode === '2' ? `19${yearCode}` : `20${yearCode}`;
}

/**
 * إنشاء نتيجة غير صالحة
 */
function createInvalidResult(): NationalIdData {
  return {
    gender: 'male',
    birthDate: new Date(),
    governorate: '',
    governorateCode: '',
    isValid: false,
  };
}
