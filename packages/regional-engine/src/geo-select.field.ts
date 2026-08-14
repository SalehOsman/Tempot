import { type Result } from 'neverthrow';
import type { AppError } from '@tempot/shared';
import type { GeoOption } from './regional.types.js';
import { GeoService } from './geo.service.js';
import { regionalToggle } from './regional.toggle.js';

/**
 * Produces plain GeoOption[] data for the Input Engine.
 * Does NOT import grammY — input-engine renders these as inline keyboards.
 */
export class GeoSelectField {
  constructor(private readonly geoService: GeoService) {}

  buildStateMenu(countryCode: string): Result<GeoOption[], AppError> {
    const disabled = regionalToggle.check();
    if (disabled) return disabled;

    return this.geoService.getStates(countryCode).map((states) =>
      states.map((state) => ({
        label: state.name_ar,
        value: state.id,
        i18nKey: state.i18nKey,
      })),
    );
  }

  buildCityMenu(stateId: string): Result<GeoOption[], AppError> {
    const disabled = regionalToggle.check();
    if (disabled) return disabled;

    return this.geoService.getCities(stateId).map((cities) =>
      cities.map((city) => ({
        label: city.name_ar,
        value: city.id,
        i18nKey: city.i18nKey,
      })),
    );
  }
}
