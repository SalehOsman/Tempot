import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { writeFileSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GeoService } from '../../src/geo.service.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const corruptFilePath = join(__dirname, '..', '..', 'data', 'geo', 'CORRUPT.json');

describe('GeoService', () => {
  const service = new GeoService();

  describe('getStates()', () => {
    it('should return 27 governorates for Egypt', () => {
      const result = service.getStates('EG');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.length).toBe(27);
        expect(result.value[0]).toHaveProperty('id');
        expect(result.value[0]).toHaveProperty('code');
        expect(result.value[0]).toHaveProperty('name');
        expect(result.value[0]).toHaveProperty('name_ar');
        expect(result.value[0]).toHaveProperty('i18nKey');
        expect(result.value[0]).toHaveProperty('countryCode');
      }
    });

    it('should return ok with empty array for unsupported country', () => {
      const result = service.getStates('XX');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual([]);
      }
    });
  });

  describe('getCities()', () => {
    it('should return cities for a given state', () => {
      const statesResult = service.getStates('EG');
      expect(statesResult.isOk()).toBe(true);
      if (statesResult.isOk()) {
        const firstState = statesResult.value[0];
        const citiesResult = service.getCities(firstState.id);
        expect(citiesResult.isOk()).toBe(true);
        if (citiesResult.isOk()) {
          expect(citiesResult.value.length).toBeGreaterThan(0);
          expect(citiesResult.value[0]).toHaveProperty('id');
          expect(citiesResult.value[0]).toHaveProperty('stateId');
          expect(citiesResult.value[0]).toHaveProperty('name');
          expect(citiesResult.value[0]).toHaveProperty('name_ar');
          expect(citiesResult.value[0]).toHaveProperty('i18nKey');
        }
      }
    });

    it('should return ok with empty array for unknown state id', () => {
      const result = service.getCities('99999');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual([]);
      }
    });
  });

  describe('getStateByCode()', () => {
    it('should find a state by code', () => {
      // Cairo's state code is 'C'
      const result = service.getStateByCode('C', 'EG');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeDefined();
        expect(result.value?.code).toBe('C');
        expect(result.value?.name).toBe('Cairo');
      }
    });

    it('should return ok(undefined) for unknown state code', () => {
      const result = service.getStateByCode('ZZZ', 'EG');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeUndefined();
      }
    });

    it('should return ok(undefined) for unsupported country', () => {
      const result = service.getStateByCode('C', 'XX');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeUndefined();
      }
    });
  });

  describe('searchGeo()', () => {
    it('should search by Arabic name', () => {
      const result = service.searchGeo('\u0627\u0644\u0642\u0627\u0647\u0631\u0629', 'EG');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.length).toBeGreaterThan(0);
      }
    });

    it('should search by English name', () => {
      const result = service.searchGeo('Cairo', 'EG');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.length).toBeGreaterThan(0);
      }
    });

    it('should return ok with empty array for unsupported country', () => {
      const result = service.searchGeo('Cairo', 'XX');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual([]);
      }
    });
  });

  describe('performance', () => {
    it('should retrieve data in < 50ms (SC-002)', () => {
      const start = performance.now();
      const result = service.getStates('EG');
      const elapsed = performance.now() - start;
      expect(result.isOk()).toBe(true);
      expect(elapsed).toBeLessThan(50);
    });
  });

  describe('corrupt geo-data', () => {
    beforeAll(() => {
      // Write a corrupt (invalid JSON) file for the test
      writeFileSync(corruptFilePath, '{ invalid json !!!', 'utf-8');
    });

    afterAll(() => {
      // Clean up the corrupt file
      try {
        unlinkSync(corruptFilePath);
      } catch {
        // Ignore if already deleted
      }
    });

    it('should return err with regional.geo_data_corrupt for malformed JSON', () => {
      const corruptService = new GeoService();
      const result = corruptService.getStates('CORRUPT');
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe('regional.geo_data_corrupt');
      }
    });
  });
});
