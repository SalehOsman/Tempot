import { describe, it, expect, beforeEach } from 'vitest';
import { EgyptianMobileFieldHandler } from '../../src/fields/identity/egyptian-mobile.field.js';
import { INPUT_ENGINE_ERRORS } from '../../src/input-engine.errors.js';
import type { FieldMetadata } from '../../src/input-engine.types.js';
import type { EgyptianMobileResult } from '../../src/input-engine.types.js';

function createMeta(overrides: Partial<FieldMetadata> = {}): FieldMetadata {
  return {
    fieldType: 'EgyptianMobile',
    i18nKey: 'test.egyptianMobile',
    ...overrides,
  } as FieldMetadata;
}

describe('EgyptianMobileFieldHandler', () => {
  let handler: EgyptianMobileFieldHandler;

  beforeEach(() => {
    handler = new EgyptianMobileFieldHandler();
  });

  it('has correct fieldType', () => {
    expect(handler.fieldType).toBe('EgyptianMobile');
  });

  describe('parseResponse', () => {
    it('strips +20 prefix', () => {
      const result = handler.parseResponse({ text: '+201001234567' }, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('01001234567');
    });

    it('strips 0020 prefix', () => {
      const result = handler.parseResponse({ text: '002001001234567' }, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('01001234567');
    });
  });

  describe('validate', () => {
    it('returns ok for valid Vodafone number', () => {
      const result = handler.validate('01001234567', undefined, createMeta());
      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap() as EgyptianMobileResult;
      expect(data.number).toBe('01001234567');
      expect(data.countryCode).toBe('+20');
      expect(data.operator).toBe('Vodafone');
    });

    it('returns ok for valid Etisalat number', () => {
      const result = handler.validate('01101234567', undefined, createMeta());
      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap() as EgyptianMobileResult;
      expect(data.operator).toBe('Etisalat');
    });

    it('returns ok for valid Orange number', () => {
      const result = handler.validate('01201234567', undefined, createMeta());
      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap() as EgyptianMobileResult;
      expect(data.operator).toBe('Orange');
    });

    it('returns ok for valid WE number', () => {
      const result = handler.validate('01501234567', undefined, createMeta());
      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap() as EgyptianMobileResult;
      expect(data.operator).toBe('WE');
    });

    it('returns err for invalid format', () => {
      const result = handler.validate('01301234567', undefined, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });

    it('returns ok when +20 prefix was stripped by parseResponse', () => {
      const parseResult = handler.parseResponse({ text: '+201001234567' }, createMeta());
      expect(parseResult.isOk()).toBe(true);
      const value = parseResult._unsafeUnwrap();
      const result = handler.validate(value, undefined, createMeta());
      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap() as EgyptianMobileResult;
      expect(data.number).toBe('01001234567');
      expect(data.operator).toBe('Vodafone');
    });
  });
});
