import { describe, it, expect } from 'vitest';
import { GeoSelectField } from '../../src/geo-select.field.js';
import { GeoService } from '../../src/geo.service.js';

describe('GeoSelectField', () => {
  const geoService = new GeoService();
  const field = new GeoSelectField(geoService);

  describe('buildStateMenu()', () => {
    it('should build a state menu with 27 GeoOption[] for Egypt', () => {
      const result = field.buildStateMenu('EG');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const options = result.value;
        expect(options.length).toBe(27);
        expect(options[0]).toHaveProperty('label');
        expect(options[0]).toHaveProperty('value');
        // Labels should be non-empty Arabic names
        expect(typeof options[0].label).toBe('string');
        expect(options[0].label.length).toBeGreaterThan(0);
        // Values should be state IDs
        expect(typeof options[0].value).toBe('string');
      }
    });

    it('should return ok with empty array for unsupported country', () => {
      const result = field.buildStateMenu('XX');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual([]);
      }
    });

    it('should use Arabic names as labels', () => {
      const result = field.buildStateMenu('EG');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        // Find Cairo (code 'C') — should have Arabic label
        const statesResult = geoService.getStates('EG');
        if (statesResult.isOk()) {
          const cairoState = statesResult.value.find((s) => s.code === 'C');
          if (cairoState) {
            const cairoOption = result.value.find((o) => o.value === cairoState.id);
            expect(cairoOption).toBeDefined();
            expect(cairoOption?.label).toBe('\u0627\u0644\u0642\u0627\u0647\u0631\u0629');
          }
        }
      }
    });
  });

  describe('buildCityMenu()', () => {
    it('should build a city menu for a given state', () => {
      const statesResult = field.buildStateMenu('EG');
      expect(statesResult.isOk()).toBe(true);
      if (statesResult.isOk()) {
        const firstStateValue = statesResult.value[0].value;
        const citiesResult = field.buildCityMenu(firstStateValue);
        expect(citiesResult.isOk()).toBe(true);
        if (citiesResult.isOk()) {
          expect(citiesResult.value.length).toBeGreaterThan(0);
          expect(citiesResult.value[0]).toHaveProperty('label');
          expect(citiesResult.value[0]).toHaveProperty('value');
          expect(typeof citiesResult.value[0].label).toBe('string');
          expect(typeof citiesResult.value[0].value).toBe('string');
        }
      }
    });

    it('should return ok with empty array for unknown state id', () => {
      const result = field.buildCityMenu('99999');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual([]);
      }
    });
  });
});
