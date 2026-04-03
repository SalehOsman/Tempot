import { describe, it, expect, beforeEach } from 'vitest';
import { DateRangeFieldHandler } from '../../src/fields/time-place/date-range.field.js';
import { INPUT_ENGINE_ERRORS } from '../../src/input-engine.errors.js';
import type { FieldMetadata } from '../../src/input-engine.types.js';

function createMeta(overrides: Partial<FieldMetadata> = {}): FieldMetadata {
  return {
    fieldType: 'DateRange',
    i18nKey: 'test.dateRange',
    ...overrides,
  } as FieldMetadata;
}

describe('DateRangeFieldHandler', () => {
  let handler: DateRangeFieldHandler;

  beforeEach(() => {
    handler = new DateRangeFieldHandler();
  });

  it('has correct fieldType', () => {
    expect(handler.fieldType).toBe('DateRange');
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
    it('parses two dates separated by " - "', () => {
      const result = handler.parseResponse({ text: '2025-03-01 - 2025-03-15' }, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual({
        startDate: '2025-03-01',
        endDate: '2025-03-15',
      });
    });

    it('parses two dates separated by " to "', () => {
      const result = handler.parseResponse({ text: '2025-06-01 to 2025-06-30' }, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual({
        startDate: '2025-06-01',
        endDate: '2025-06-30',
      });
    });

    it('returns err for missing text', () => {
      const result = handler.parseResponse({}, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED);
    });

    it('returns err for invalid date format in range', () => {
      const result = handler.parseResponse({ text: 'abc - def' }, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED);
    });
  });

  describe('validate', () => {
    it('returns ok when endDate >= startDate', () => {
      const value = { startDate: '2025-03-01', endDate: '2025-03-15' };
      const result = handler.validate(value, undefined, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(value);
    });

    it('returns ok when endDate equals startDate', () => {
      const value = { startDate: '2025-03-15', endDate: '2025-03-15' };
      const result = handler.validate(value, undefined, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(value);
    });

    it('returns err when endDate < startDate', () => {
      const value = { startDate: '2025-03-15', endDate: '2025-03-01' };
      const result = handler.validate(value, undefined, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });
  });
});
