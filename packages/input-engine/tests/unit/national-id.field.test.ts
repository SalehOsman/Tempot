import { describe, it, expect, beforeEach } from 'vitest';
import { NationalIDFieldHandler } from '../../src/fields/identity/national-id.field.js';
import { INPUT_ENGINE_ERRORS } from '../../src/input-engine.errors.js';
import type { FieldMetadata } from '../../src/input-engine.types.js';
import type { NationalIDResult } from '../../src/input-engine.types.js';

function createMeta(overrides: Partial<FieldMetadata> = {}): FieldMetadata {
  return {
    fieldType: 'NationalID',
    i18nKey: 'test.nationalId',
    ...overrides,
  } as FieldMetadata;
}

describe('NationalIDFieldHandler', () => {
  let handler: NationalIDFieldHandler;

  beforeEach(() => {
    handler = new NationalIDFieldHandler();
  });

  it('has correct fieldType', () => {
    expect(handler.fieldType).toBe('NationalID');
  });

  describe('parseResponse', () => {
    it('extracts and trims text from message', () => {
      const result = handler.parseResponse({ text: '  29501011234567  ' }, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('29501011234567');
    });

    it('returns err when no text in message', () => {
      const result = handler.parseResponse({}, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED);
    });
  });

  describe('validate', () => {
    it('returns ok for valid ID without extract', () => {
      const result = handler.validate('29501011234567', undefined, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('29501011234567');
    });

    it('returns NationalIDResult when extractData is true', () => {
      // 2 = 1900s century, 950101 = Jan 1 1995, 01 = Cairo, 2345 serial, 6 = female(even), 7 = check
      const result = handler.validate(
        '29501010123460',
        undefined,
        createMeta({ extractData: true }),
      );
      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap() as NationalIDResult;
      expect(data.id).toBe('29501010123460');
      expect(data.birthDate).toBe('1995-01-01');
      expect(data.governorate).toBe('Cairo');
      expect(data.gender).toBe('female');
    });

    it('returns err for wrong length', () => {
      const result = handler.validate('1234567890', undefined, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });

    it('returns err for non-digit characters', () => {
      const result = handler.validate('2950101123456A', undefined, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });

    it('returns err for future birth date', () => {
      // 3 = 2000s century, 990101 = Jan 1 2099 (future)
      const result = handler.validate('39901011234567', undefined, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.NATIONAL_ID_FUTURE_DATE);
    });

    it('returns err for invalid century digit', () => {
      // Century digit 1 is invalid (not 2 or 3)
      const result = handler.validate('19501011234567', undefined, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.NATIONAL_ID_CHECKSUM_FAILED);
    });

    it('validates a female ID correctly', () => {
      // Digit 13 is even (6) = female
      const result = handler.validate(
        '29501010112360',
        undefined,
        createMeta({ extractData: true }),
      );
      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap() as NationalIDResult;
      expect(data.gender).toBe('female');
    });

    it('validates a male ID correctly', () => {
      // Digit 13 is odd (3) = male
      const result = handler.validate(
        '29501010112350',
        undefined,
        createMeta({ extractData: true }),
      );
      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap() as NationalIDResult;
      expect(data.gender).toBe('male');
    });

    it('validates a 2000s born ID', () => {
      // 3 = 2000s century, 050315 = Mar 15 2005
      const result = handler.validate(
        '30503150112350',
        undefined,
        createMeta({ extractData: true }),
      );
      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap() as NationalIDResult;
      expect(data.birthDate).toBe('2005-03-15');
    });

    it('extracts governorate correctly', () => {
      // Digits 8-9 = '02' = Alexandria
      const result = handler.validate(
        '29501010212350',
        undefined,
        createMeta({ extractData: true }),
      );
      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap() as NationalIDResult;
      expect(data.governorate).toBe('Alexandria');
    });
  });
});
