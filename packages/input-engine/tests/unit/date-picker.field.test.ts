import { describe, it, expect, beforeEach } from 'vitest';
import { DatePickerFieldHandler } from '../../src/fields/time-place/date-picker.field.js';
import { INPUT_ENGINE_ERRORS } from '../../src/input-engine.errors.js';
import type { FieldMetadata } from '../../src/input-engine.types.js';

function createMeta(overrides: Partial<FieldMetadata> = {}): FieldMetadata {
  return {
    fieldType: 'DatePicker',
    i18nKey: 'test.datePicker',
    ...overrides,
  } as FieldMetadata;
}

describe('DatePickerFieldHandler', () => {
  let handler: DatePickerFieldHandler;

  beforeEach(() => {
    handler = new DatePickerFieldHandler();
  });

  it('has correct fieldType', () => {
    expect(handler.fieldType).toBe('DatePicker');
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
    it('parses valid ISO date from text message', () => {
      const result = handler.parseResponse({ text: '2025-03-15' }, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('2025-03-15');
    });

    it('parses date from callback data', () => {
      const result = handler.parseResponse({ data: 'date:2025-07-20' }, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('2025-07-20');
    });

    it('returns err for missing text and data', () => {
      const result = handler.parseResponse({}, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED);
    });

    it('returns err for invalid date format', () => {
      const result = handler.parseResponse({ text: 'not-a-date' }, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED);
    });
  });

  describe('validate', () => {
    it('returns ok for valid date string', () => {
      const result = handler.validate('2025-03-15', undefined, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('2025-03-15');
    });

    it('returns err for date before min', () => {
      const min = Date.parse('2025-06-01');
      const result = handler.validate('2025-03-15', undefined, createMeta({ min }));
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });

    it('returns err for date after max', () => {
      const max = Date.parse('2025-01-01');
      const result = handler.validate('2025-03-15', undefined, createMeta({ max }));
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });

    it('returns ok for date within min/max range', () => {
      const min = Date.parse('2025-01-01');
      const max = Date.parse('2025-12-31');
      const result = handler.validate('2025-06-15', undefined, createMeta({ min, max }));
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('2025-06-15');
    });
  });
});
