import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ok, err, type Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { GeoState, GeoCity } from './regional.types.js';
import { regionalToggle } from './regional.toggle.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface GeoDataFile {
  countryCode: string;
  states: GeoState[];
  cities: GeoCity[];
}

/** Sentinel value indicating the file exists but is corrupt/malformed. */
const CORRUPT_SENTINEL = Symbol('corrupt');

/**
 * Loads a geo-data JSON file for a given country code.
 * Returns undefined if the file doesn't exist (unsupported country).
 * Returns CORRUPT_SENTINEL if the file exists but is malformed.
 */
function loadGeoData(countryCode: string): GeoDataFile | undefined | typeof CORRUPT_SENTINEL {
  const filePath = join(__dirname, '..', 'data', 'geo', `${countryCode}.json`);

  if (!existsSync(filePath)) {
    return undefined;
  }

  try {
    const raw = readFileSync(filePath, 'utf-8');
    const parsed: unknown = JSON.parse(raw);

    // Validate basic structure
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !Array.isArray((parsed as GeoDataFile).states) ||
      !Array.isArray((parsed as GeoDataFile).cities)
    ) {
      return CORRUPT_SENTINEL;
    }

    return parsed as GeoDataFile;
  } catch {
    return CORRUPT_SENTINEL;
  }
}

// Static registry — loaded once at module initialization
const GEO_REGISTRY: Record<string, GeoDataFile | typeof CORRUPT_SENTINEL> = {};

function ensureLoaded(countryCode: string): GeoDataFile | undefined | typeof CORRUPT_SENTINEL {
  if (!(countryCode in GEO_REGISTRY)) {
    const data = loadGeoData(countryCode);
    if (data !== undefined) {
      GEO_REGISTRY[countryCode] = data;
    }
  }
  return GEO_REGISTRY[countryCode];
}

function corruptError(countryCode: string): AppError {
  return new AppError('regional.geo_data_corrupt', `Geo-data file for ${countryCode} is malformed`);
}

export class GeoService {
  getStates(countryCode: string): Result<GeoState[], AppError> {
    const disabled = regionalToggle.check();
    if (disabled) return disabled;

    const data = ensureLoaded(countryCode);
    if (data === CORRUPT_SENTINEL) {
      return err(corruptError(countryCode));
    }
    if (!data) {
      return ok([]);
    }
    return ok(data.states);
  }

  getCities(stateId: string): Result<GeoCity[], AppError> {
    const disabled = regionalToggle.check();
    if (disabled) return disabled;

    for (const countryCode of Object.keys(GEO_REGISTRY)) {
      const entry = GEO_REGISTRY[countryCode];
      if (entry === CORRUPT_SENTINEL) {
        continue;
      }
      const cities = entry.cities.filter((c) => c.stateId === stateId);
      if (cities.length > 0) {
        return ok(cities);
      }
    }
    return ok([]);
  }

  getStateByCode(code: string, countryCode: string): Result<GeoState | undefined, AppError> {
    const disabled = regionalToggle.check();
    if (disabled) return disabled;

    const data = ensureLoaded(countryCode);
    if (data === CORRUPT_SENTINEL) {
      return err(corruptError(countryCode));
    }
    if (!data) {
      return ok(undefined);
    }
    const state = data.states.find((s) => s.code === code);
    return ok(state);
  }

  searchGeo(query: string, countryCode: string): Result<Array<GeoState | GeoCity>, AppError> {
    const disabled = regionalToggle.check();
    if (disabled) return disabled;

    const data = ensureLoaded(countryCode);
    if (data === CORRUPT_SENTINEL) {
      return err(corruptError(countryCode));
    }
    if (!data) {
      return ok([]);
    }
    const lowerQuery = query.toLowerCase();
    const matchingStates = data.states.filter(
      (s) => s.name.toLowerCase().includes(lowerQuery) || s.name_ar.includes(query),
    );
    const matchingCities = data.cities.filter(
      (c) => c.name.toLowerCase().includes(lowerQuery) || c.name_ar.includes(query),
    );
    return ok([...matchingStates, ...matchingCities]);
  }
}
