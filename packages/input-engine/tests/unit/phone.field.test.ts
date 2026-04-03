import { describe, it, expect, beforeEach } from 'vitest';
import { PhoneFieldHandler } from '../../src/fields/text/phone.field.js';
import { INPUT_ENGINE_ERRORS } from '../../src/input-engine.errors.js';
import type { FieldMetadata } from '../../src/input-engine.types.js';

function createMeta(overrides: Partial<FieldMetadata> = {}): FieldMetadata {
  return {
    fieldType: 'Phone',
    i18nKey: 'test.phone',
    ...overrides,
  } as FieldMetadata;
}

describe('PhoneFieldHandler', () => {
  let handler: PhoneFieldHandler;

  beforeEach(() => {
    handler = new PhoneFieldHandler();
  });

  it('has correct fieldType', () => {
    expect(handler.fieldType).toBe('Phone');
  });

  describe('parseResponse', () => {
    it('extracts and trims text from message', () => {
      const result = handler.parseResponse({ text: '  +1234567890  ' }, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('+1234567890');
    });

    it('returns err when no text in message', () => {
      const result = handler.parseResponse({}, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED);
    });
  });

  describe('validate', () => {
    it('returns ok for valid phone with +', () => {
      const result = handler.validate('+1234567890', undefined, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('+1234567890');
    });

    it('returns ok for valid phone without +', () => {
      const result = handler.validate('1234567890', undefined, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('1234567890');
    });

    it('returns err when phone contains letters', () => {
      const result = handler.validate('+123abc7890', undefined, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });

    it('returns err when phone is too short', () => {
      const result = handler.validate('+1', undefined, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });

    it('returns err when phone is too long', () => {
      const result = handler.validate('+1234567890123456', undefined, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });
  });
});
