/**
 * الأنواع والواجهات لاستخراج بيانات الرقم القومي المصري
 */

export type Gender = 'male' | 'female';

export interface NationalIdData {
  gender: Gender;
  birthDate: Date;
  governorate: string;
  governorateCode: string;
  isValid: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ExtractedData {
  gender: Gender;
  birthDate: Date;
  governorate: string;
}

export interface GovernorateCode {
  code: string;
  name: string;
}
