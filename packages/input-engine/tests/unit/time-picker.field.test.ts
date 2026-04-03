import { describe, it, expect, beforeEach } from 'vitest';
import { TimePickerFieldHandler } from '../../src/fields/time-place/time-picker.field.js';
import { INPUT_ENGINE_ERRORS } from '../../src/input-engine.errors.js';
import type { FieldMetadata } from '../../src/input-engine.types.js';

function createMeta(overrides: Partial<FieldMetadata> = {}): FieldMetadata {
  return {
    fieldType: 'TimePicker',
    i18nKey: 'test.timePicker',
    ...overrides,
  } as FieldMetadata;
}

describe('TimePickerFieldHandler', () => {
  let handler: TimePickerFieldHandler;

  beforeEach(() => {
    handler = new TimePickerFieldHandler();
  });

  it('has correct fieldType', () => {
    expect(handler.fieldType).toBe('TimePicker');
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
    it('parses 24-hour HH:MM format', () => {
      const result = handler.parseResponse({ text: '14:30' }, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('14:30');
    });

    it('parses 12-hour format with AM/PM', () => {
      const meta = createMeta({ use12Hour: true });
      const result = handler.parseResponse({ text: '3:00 PM' }, meta);
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('15:00');
    });

    it('returns err for missing text', () => {
      const result = handler.parseResponse({}, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED);
    });

    it('returns err for invalid time format', () => {
      const result = handler.parseResponse({ text: 'abc' }, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED);
    });
  });

  describe('validate', () => {
    it('returns ok for valid time', () => {
      const result = handler.validate('14:30', undefined, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('14:30');
    });

    it('returns err for hours out of range', () => {
      const result = handler.validate('25:00', undefined, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });

    it('returns err for minutes out of range', () => {
      const result = handler.validate('12:60', undefined, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });
  });
});
