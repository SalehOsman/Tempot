import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ok, type Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { GeoState, GeoCity } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface GeoDataFile {
  countryCode: string;
  states: GeoState[];
  cities: GeoCity[];
}

/**
 * Loads a geo-data JSON file for a given country code.
 * Returns undefined if the file doesn't exist (unsupported country).
 */
function loadGeoData(countryCode: string): GeoDataFile | undefined {
  try {
    // In dist/: data files are at ../data/geo/ relative to dist/
    // In src/ (tests): data files are at ../data/geo/ relative to src/
    const filePath = join(__dirname, '..', 'data', 'geo', `${countryCode}.json`);
    const raw = readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as GeoDataFile;
  } catch {
    return undefined;
  }
}

// Static registry — loaded once at module initialization
const GEO_REGISTRY: Record<string, GeoDataFile> = {};

function ensureLoaded(countryCode: string): GeoDataFile | undefined {
  if (!(countryCode in GEO_REGISTRY)) {
    const data = loadGeoData(countryCode);
    if (data) {
      GEO_REGISTRY[countryCode] = data;
    }
  }
  return GEO_REGISTRY[countryCode];
}

export class GeoService {
  getStates(countryCode: string): Result<GeoState[], AppError> {
    const data = ensureLoaded(countryCode);
    if (!data) {
      return ok([]);
    }
    return ok(data.states);
  }

  getCities(stateId: string): Result<GeoCity[], AppError> {
    for (const countryCode of Object.keys(GEO_REGISTRY)) {
      ensureLoaded(countryCode);
    }
    for (const data of Object.values(GEO_REGISTRY)) {
      const cities = data.cities.filter((c) => c.stateId === stateId);
      if (cities.length > 0) {
        return ok(cities);
      }
    }
    return ok([]);
  }

  getStateByCode(code: string, countryCode: string): Result<GeoState | undefined, AppError> {
    const data = ensureLoaded(countryCode);
    if (!data) {
      return ok(undefined);
    }
    const state = data.states.find((s) => s.code === code);
    return ok(state);
  }

  searchGeo(query: string, countryCode: string): Result<Array<GeoState | GeoCity>, AppError> {
    const data = ensureLoaded(countryCode);
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
