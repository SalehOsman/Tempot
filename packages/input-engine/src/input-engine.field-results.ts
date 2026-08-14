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
