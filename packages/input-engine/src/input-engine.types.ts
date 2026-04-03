import type { AsyncResult } from '@tempot/shared';
import type { AppError } from '@tempot/shared';

/** All 39 supported field types across 9 categories */
export type FieldType =
  // Text (6)
  | 'ShortText'
  | 'LongText'
  | 'Email'
  | 'Phone'
  | 'URL'
  | 'RegexValidated'
  // Numbers (5)
  | 'Integer'
  | 'Float'
  | 'Currency'
  | 'Percentage'
  | 'CurrencyAmount'
  // Choice (4)
  | 'SingleChoice'
  | 'MultipleChoice'
  | 'BooleanToggle'
  | 'SearchableList'
  // Time/Place (5)
  | 'DatePicker'
  | 'TimePicker'
  | 'Location'
  | 'DateRange'
  | 'SchedulePicker'
  // Media (6)
  | 'Photo'
  | 'Document'
  | 'Video'
  | 'Audio'
  | 'FileGroup'
  | 'Contact'
  // Smart (2)
  | 'ConditionalField'
  | 'AIExtractorField'
  // Geo (2)
  | 'GeoSelectField'
  | 'GeoAddressField'
  // Identity (4)
  | 'NationalID'
  | 'PassportNumber'
  | 'IBAN'
  | 'EgyptianMobile'
  // Interactive (5)
  | 'StarRating'
  | 'MultiStepChoice'
  | 'QRCode'
  | 'Toggle'
  | 'Tags';

/** Selectable option for choice fields */
export interface ChoiceOption {
  value: string;
  label: string; // i18n key
  emoji?: string;
  disabled?: boolean;
}

/** Condition for ConditionalField */
export interface FieldCondition {
  dependsOn: string;
  operator: 'equals' | 'notEquals' | 'in' | 'gt' | 'lt' | 'custom';
  value?: unknown;
  fn?: (formData: Record<string, unknown>) => boolean;
}

/** Level definition for MultiStepChoice */
export interface MultiStepLevel {
  label: string; // i18n key
  options?: ChoiceOption[];
  dataSource?: (parentValue: string) => AsyncResult<ChoiceOption[], AppError>;
}

/** Field metadata attached via z.globalRegistry.register() */
export interface FieldMetadata {
  fieldType: FieldType;
  i18nKey: string;
  i18nErrorKey?: string;
  order?: number;
  optional?: boolean;
  conditions?: FieldCondition[];
  maxRetries?: number;
  // Field-type-specific options
  options?: ChoiceOption[];
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  maxSizeKB?: number;
  allowedExtensions?: string[];
  allowedTypes?: string[];
  maxDurationSeconds?: number;
  minFiles?: number;
  maxFiles?: number;
  minSelections?: number;
  maxSelections?: number;
  pattern?: RegExp;
  targetFields?: string[];
  levels?: MultiStepLevel[];
  preserveQuality?: boolean;
  use12Hour?: boolean;
  dataSource?: () => AsyncResult<ChoiceOption[], AppError>;
  // SchedulePicker
  availableSlots?: TimeSlot[];
  slotDataSource?: (date: string) => AsyncResult<TimeSlot[], AppError>;
  slotDuration?: number;
  // EgyptianMobile
  countryCodes?: CountryCode[];
  defaultCountryCode?: string;
  // IBAN
  defaultCountry?: string;
  allowedCountries?: string[];
  // CurrencyAmount
  currency?: string;
  allowedCurrencies?: string[];
  decimalPlaces?: number;
  // QRCode
  expectedFormat?: 'url' | 'text' | 'json' | 'any';
  // Toggle
  onLabel?: string;
  offLabel?: string;
  defaultValue?: boolean;
  // Tags
  minTags?: number;
  maxTags?: number;
  allowCustom?: boolean;
  predefinedTags?: ChoiceOption[];
  maxTagLength?: number;
  // NationalID (enhanced)
  extractData?: boolean;
}

/** Available time slot for SchedulePicker */
export interface TimeSlot {
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  slotId?: string;
  available: boolean;
  label?: string; // i18n key
}

/** Country code option for EgyptianMobile */
export interface CountryCode {
  code: string; // ISO 3166-1 alpha-2
  dialCode: string; // e.g., '+20'
  name: string; // i18n key
  flag?: string; // Flag emoji
}

/** Result from NationalID with extractData: true */
export interface NationalIDResult {
  id: string;
  birthDate?: string; // ISO 8601
  governorate?: string;
  gender?: 'male' | 'female';
}

/** Result from Contact field */
export interface ContactResult {
  phoneNumber: string;
  firstName: string;
  lastName?: string;
  userId?: number;
}

/** Result from SchedulePicker field */
export interface SchedulePickerResult {
  date: string; // ISO 8601 date
  time: string; // HH:MM
  slotId?: string;
}

/** Result from EgyptianMobile field */
export interface EgyptianMobileResult {
  number: string;
  countryCode: string;
  operator?: string;
}

/** Result from CurrencyAmount field */
export interface CurrencyAmountResult {
  amount: number;
  currency: string; // ISO 4217
}

/** Options for runForm() */
export interface FormOptions {
  partialSave?: boolean;
  partialSaveTTL?: number; // ms, default 86400000 (24h)
  maxMilliseconds?: number; // ms, default 600000 (10 min)
  allowCancel?: boolean; // default true
  formId?: string; // auto-generated if not provided
}

/** Default form options */
export const DEFAULT_FORM_OPTIONS: Required<FormOptions> = {
  partialSave: false,
  partialSaveTTL: 86_400_000,
  maxMilliseconds: 600_000,
  allowCancel: true,
  formId: '', // Will be replaced with UUID at runtime
};
