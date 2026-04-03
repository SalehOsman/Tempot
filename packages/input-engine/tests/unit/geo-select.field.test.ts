import { describe, it, expect, beforeEach } from 'vitest';
import { GeoSelectFieldHandler } from '../../src/fields/geo/geo-select.field.js';
import { INPUT_ENGINE_ERRORS } from '../../src/input-engine.errors.js';
import type { FieldMetadata } from '../../src/input-engine.types.js';

function createMeta(overrides: Partial<FieldMetadata> = {}): FieldMetadata {
  return {
    fieldType: 'GeoSelectField',
    i18nKey: 'test.geoSelect',
    ...overrides,
  } as FieldMetadata;
}

describe('GeoSelectFieldHandler', () => {
  let handler: GeoSelectFieldHandler;

  beforeEach(() => {
    handler = new GeoSelectFieldHandler();
  });

  it('has correct fieldType', () => {
    expect(handler.fieldType).toBe('GeoSelectField');
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
    it('extracts value from callback data', () => {
      const message = { callback_query: { data: 'ie:form1:2:cairo_governorate' } };
      const result = handler.parseResponse(message, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('cairo_governorate');
    });

    it('extracts value with colons in the value part', () => {
      const message = { callback_query: { data: 'ie:form1:2:region:sub:id' } };
      const result = handler.parseResponse(message, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('region:sub:id');
    });

    it('falls back to text when no callback data', () => {
      const message = { text: '  Cairo  ' };
      const result = handler.parseResponse(message, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('Cairo');
    });

    it('returns err when neither callback data nor text provided', () => {
      const result = handler.parseResponse({}, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED);
    });

    it('returns err when callback data has invalid prefix', () => {
      const message = { callback_query: { data: 'other:form1:2:value' } };
      const result = handler.parseResponse(message, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED);
    });

    it('returns err when callback data is missing value segment', () => {
      const message = { callback_query: { data: 'ie:form1:2' } };
      const result = handler.parseResponse(message, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED);
    });
  });

  describe('validate', () => {
    it('returns ok for valid non-empty string', () => {
      const result = handler.validate('cairo_governorate', undefined, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('cairo_governorate');
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
