import { describe, it, expect, beforeEach } from 'vitest';
import { GeoAddressFieldHandler } from '../../src/fields/geo/geo-address.field.js';
import { INPUT_ENGINE_ERRORS } from '../../src/input-engine.errors.js';
import type { FieldMetadata } from '../../src/input-engine.types.js';

function createMeta(overrides: Partial<FieldMetadata> = {}): FieldMetadata {
  return {
    fieldType: 'GeoAddressField',
    i18nKey: 'test.geoAddress',
    ...overrides,
  } as FieldMetadata;
}

describe('GeoAddressFieldHandler', () => {
  let handler: GeoAddressFieldHandler;

  beforeEach(() => {
    handler = new GeoAddressFieldHandler();
  });

  it('has correct fieldType', () => {
    expect(handler.fieldType).toBe('GeoAddressField');
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
    it('extracts text from message', () => {
      const message = { text: '  123 Main Street, Cairo  ' };
      const result = handler.parseResponse(message, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('123 Main Street, Cairo');
    });

    it('formats location as "lat,lng" string', () => {
      const message = { location: { latitude: 30.0444, longitude: 31.2357 } };
      const result = handler.parseResponse(message, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('30.0444,31.2357');
    });

    it('prefers location over text when both present', () => {
      const message = {
        text: 'Some address',
        location: { latitude: 30.0444, longitude: 31.2357 },
      };
      const result = handler.parseResponse(message, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('30.0444,31.2357');
    });

    it('returns err when neither text nor location provided', () => {
      const result = handler.parseResponse({}, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED);
    });

    it('returns err for empty text without location', () => {
      const message = { text: '   ' };
      const result = handler.parseResponse(message, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED);
    });
  });

  describe('validate', () => {
    it('returns ok for valid non-empty string', () => {
      const result = handler.validate('123 Main Street', undefined, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('123 Main Street');
    });

    it('returns ok for lat,lng format string', () => {
      const result = handler.validate('30.0444,31.2357', undefined, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('30.0444,31.2357');
    });

    it('returns err for empty string', () => {
      const result = handler.validate('', undefined, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });

    it('returns err for whitespace-only string', () => {
      const result = handler.validate('   ', undefined, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });
  });
});
