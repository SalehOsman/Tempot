/** Per-user or global regional settings */
export interface RegionalContext {
  timezone: string; // e.g., 'Africa/Cairo'
  locale: string; // e.g., 'ar-EG'
  currencyCode: string; // e.g., 'EGP'
  countryCode: string; // e.g., 'EG'
}

/** A geographic state/governorate */
export interface GeoState {
  id: string;
  code: string;
  name: string;
  name_ar: string;
  i18nKey: string; // e.g., 'geo.EG.states.CAI'
  countryCode: string;
}

/** A city within a state */
export interface GeoCity {
  id: string;
  stateId: string;
  name: string;
  name_ar: string;
  i18nKey: string; // e.g., 'geo.EG.cities.CAI.heliopolis'
}

/** Plain data structure for UI rendering — consumed by input-engine */
export interface GeoOption {
  label: string; // Display text (e.g., Arabic name)
  value: string; // Unique identifier (e.g., state code)
}

/** Default regional context — Egypt as primary market (Rule XLII) */
export const DEFAULT_REGIONAL_CONTEXT: RegionalContext = {
  timezone: 'Africa/Cairo',
  locale: 'ar-EG',
  currencyCode: 'EGP',
  countryCode: 'EG',
};
