import { describe, it, expect, beforeEach } from 'vitest';
import { PassportFieldHandler } from '../../src/fields/identity/passport.field.js';
import { INPUT_ENGINE_ERRORS } from '../../src/input-engine.errors.js';
import type { FieldMetadata } from '../../src/input-engine.types.js';

function createMeta(overrides: Partial<FieldMetadata> = {}): FieldMetadata {
  return {
    fieldType: 'PassportNumber',
    i18nKey: 'test.passport',
    ...overrides,
  } as FieldMetadata;
}

describe('PassportFieldHandler', () => {
  let handler: PassportFieldHandler;

  beforeEach(() => {
    handler = new PassportFieldHandler();
  });

  it('has correct fieldType', () => {
    expect(handler.fieldType).toBe('PassportNumber');
  });

  describe('parseResponse', () => {
    it('extracts text, trims and uppercases', () => {
      const result = handler.parseResponse({ text: '  a12345678  ' }, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('A12345678');
    });
  });

  describe('validate', () => {
    it('returns ok for valid passport number', () => {
      const result = handler.validate('A12345678', undefined, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('A12345678');
    });

    it('returns err for too short passport number', () => {
      const result = handler.validate('A1234', undefined, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });

    it('returns err for invalid characters', () => {
      const result = handler.validate('A123-5678', undefined, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });
  });
});
