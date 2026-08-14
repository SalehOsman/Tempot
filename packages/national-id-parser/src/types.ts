export type Gender = 'male' | 'female';

export type NationalIdValidationErrorCode =
  | 'nationalId.validation.empty'
  | 'nationalId.validation.invalidLength'
  | 'nationalId.validation.nonNumeric'
  | 'nationalId.validation.invalidCentury'
  | 'nationalId.validation.invalidYear'
  | 'nationalId.validation.invalidMonth'
  | 'nationalId.validation.invalidDay'
  | 'nationalId.validation.invalidGovernorate';

export interface NationalIdData {
  gender: Gender;
  birthDate: Date;
  governorate: string;
  governorateCode: string;
  isValid: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: NationalIdValidationErrorCode[];
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
