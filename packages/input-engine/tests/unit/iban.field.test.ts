import { describe, it, expect, beforeEach } from 'vitest';
import { IBANFieldHandler } from '../../src/fields/identity/iban.field.js';
import { INPUT_ENGINE_ERRORS } from '../../src/input-engine.errors.js';
import type { FieldMetadata } from '../../src/input-engine.types.js';

function createMeta(overrides: Partial<FieldMetadata> = {}): FieldMetadata {
  return {
    fieldType: 'IBAN',
    i18nKey: 'test.iban',
    ...overrides,
  } as FieldMetadata;
}

describe('IBANFieldHandler', () => {
  let handler: IBANFieldHandler;

  beforeEach(() => {
    handler = new IBANFieldHandler();
  });

  it('has correct fieldType', () => {
    expect(handler.fieldType).toBe('IBAN');
  });

  describe('parseResponse', () => {
    it('strips spaces and uppercases', () => {
      const result = handler.parseResponse({ text: ' de89 3704 0044 0532 0130 00 ' }, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('DE89370400440532013000');
    });
  });

  describe('validate', () => {
    it('returns ok for valid EG IBAN', () => {
      // Valid Egyptian IBAN (29 chars)
      const result = handler.validate('EG380019000500000000263180002', undefined, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('EG380019000500000000263180002');
    });

    it('returns ok for valid DE IBAN', () => {
      const result = handler.validate('DE89370400440532013000', undefined, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('DE89370400440532013000');
    });

    it('returns err for invalid checksum', () => {
      // Same as valid DE but last digit changed
      const result = handler.validate('DE89370400440532013001', undefined, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.IBAN_INVALID_CHECKSUM);
    });

    it('returns err for wrong length', () => {
      // DE requires 22, this is 21
      const result = handler.validate('DE8937040044053201300', undefined, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });

    it('returns err for country not in IBAN_LENGTHS', () => {
      const result = handler.validate('XX12345678901234', undefined, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });

    it('returns err for country not in allowedCountries', () => {
      const result = handler.validate(
        'DE89370400440532013000',
        undefined,
        createMeta({ allowedCountries: ['EG', 'SA'] }),
      );
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.IBAN_COUNTRY_NOT_ALLOWED);
    });

    it('strips spaces before validation', () => {
      const result = handler.validate('DE89 3704 0044 0532 0130 00', undefined, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('DE89370400440532013000');
    });

    it('normalizes lowercase to uppercase', () => {
      const result = handler.validate('de89370400440532013000', undefined, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('DE89370400440532013000');
    });
  });
});
