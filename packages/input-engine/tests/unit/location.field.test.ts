import { describe, it, expect, beforeEach } from 'vitest';
import { LocationFieldHandler } from '../../src/fields/time-place/location.field.js';
import { INPUT_ENGINE_ERRORS } from '../../src/input-engine.errors.js';
import type { FieldMetadata } from '../../src/input-engine.types.js';

function createMeta(overrides: Partial<FieldMetadata> = {}): FieldMetadata {
  return {
    fieldType: 'Location',
    i18nKey: 'test.location',
    ...overrides,
  } as FieldMetadata;
}

describe('LocationFieldHandler', () => {
  let handler: LocationFieldHandler;

  beforeEach(() => {
    handler = new LocationFieldHandler();
  });

  it('has correct fieldType', () => {
    expect(handler.fieldType).toBe('Location');
  });

  describe('render', () => {
    it('returns ok(undefined)', async () => {
      const result = await handler.render(
        { conversation: undefined, ctx: undefined, formData: {} },
        createMeta(),
      );
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBeUndefined();
    });
  });

  describe('parseResponse', () => {
    it('extracts latitude and longitude from location message', () => {
      const message = { location: { latitude: 30.0444, longitude: 31.2357 } };
      const result = handler.parseResponse(message, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual({ latitude: 30.0444, longitude: 31.2357 });
    });

    it('returns err when no location in message', () => {
      const result = handler.parseResponse({}, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED);
    });
  });

  describe('validate', () => {
    it('returns ok for valid coordinates', () => {
      const value = { latitude: 30.0444, longitude: 31.2357 };
      const result = handler.validate(value, undefined, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(value);
    });

    it('returns err for latitude out of range', () => {
      const value = { latitude: 91, longitude: 31.2357 };
      const result = handler.validate(value, undefined, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });

    it('returns err for longitude out of range', () => {
      const value = { latitude: 30.0444, longitude: 181 };
      const result = handler.validate(value, undefined, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });

    it('returns err for negative latitude out of range', () => {
      const value = { latitude: -91, longitude: 0 };
      const result = handler.validate(value, undefined, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });
  });
});
