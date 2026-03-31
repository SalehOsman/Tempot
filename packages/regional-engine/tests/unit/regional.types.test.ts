import { describe, it, expect } from 'vitest';
import {
  DEFAULT_REGIONAL_CONTEXT,
  type RegionalContext,
  type GeoState,
  type GeoCity,
  type GeoOption,
} from '../../src/regional.types.js';

describe('Type Definitions', () => {
  it('should export DEFAULT_REGIONAL_CONTEXT with Egypt defaults', () => {
    expect(DEFAULT_REGIONAL_CONTEXT).toEqual({
      timezone: 'Africa/Cairo',
      locale: 'ar-EG',
      currencyCode: 'EGP',
      countryCode: 'EG',
    });
  });

  it('should allow creating a non-Egypt RegionalContext', () => {
    const ctx: RegionalContext = {
      timezone: 'Asia/Riyadh',
      locale: 'ar-SA',
      currencyCode: 'SAR',
      countryCode: 'SA',
    };
    expect(ctx.timezone).toBe('Asia/Riyadh');
    expect(ctx.countryCode).toBe('SA');
  });

  it('should type GeoState with all required fields', () => {
    const state: GeoState = {
      id: '1',
      code: 'CAI',
      name: 'Cairo',
      name_ar: '\u0627\u0644\u0642\u0627\u0647\u0631\u0629',
      i18nKey: 'geo.EG.states.CAI',
      countryCode: 'EG',
    };
    expect(state.id).toBe('1');
    expect(state.i18nKey).toBe('geo.EG.states.CAI');
  });

  it('should type GeoCity with all required fields', () => {
    const city: GeoCity = {
      id: '100',
      stateId: '1',
      name: 'Heliopolis',
      name_ar: '\u0645\u0635\u0631 \u0627\u0644\u062c\u062f\u064a\u062f\u0629',
      i18nKey: 'geo.EG.cities.CAI.heliopolis',
    };
    expect(city.stateId).toBe('1');
    expect(city.i18nKey).toBe('geo.EG.cities.CAI.heliopolis');
  });

  it('should type GeoOption as plain label/value pair', () => {
    const option: GeoOption = { label: '\u0627\u0644\u0642\u0627\u0647\u0631\u0629', value: 'CAI' };
    expect(option.label).toBe('\u0627\u0644\u0642\u0627\u0647\u0631\u0629');
    expect(option.value).toBe('CAI');
  });
});
