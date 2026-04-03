import { describe, it, expect, beforeEach } from 'vitest';
import { CurrencyFieldHandler } from '../../src/fields/numbers/currency.field.js';
import { INPUT_ENGINE_ERRORS } from '../../src/input-engine.errors.js';
import type { FieldMetadata } from '../../src/input-engine.types.js';

function createMeta(overrides: Partial<FieldMetadata> = {}): FieldMetadata {
  return {
    fieldType: 'Currency',
    i18nKey: 'test.currency',
    ...overrides,
  } as FieldMetadata;
}

describe('CurrencyFieldHandler', () => {
  let handler: CurrencyFieldHandler;

  beforeEach(() => {
    handler = new CurrencyFieldHandler();
  });

  it('has correct fieldType', () => {
    expect(handler.fieldType).toBe('Currency');
  });

  describe('parseResponse', () => {
    it('parses valid currency value from message text', () => {
      const result = handler.parseResponse({ text: '99.99' }, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBeCloseTo(99.99);
    });

    it('normalizes Arabic numerals', () => {
      const result = handler.parseResponse({ text: '٩٩.٩٩' }, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBeCloseTo(99.99);
    });

    it('returns err when no text in message', () => {
      const result = handler.parseResponse({}, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED);
    });
  });

  describe('validate', () => {
    it('returns ok for valid currency value with 2 decimal places', () => {
      const result = handler.validate(99.99, undefined, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBeCloseTo(99.99);
    });

    it('rejects negative values', () => {
      const result = handler.validate(-5.0, undefined, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });

    it('rejects values with more than 2 decimal places', () => {
      const result = handler.validate(9.999, undefined, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });

    it('enforces min/max boundaries', () => {
      const resultBelow = handler.validate(5.0, undefined, createMeta({ min: 10.0 }));
      expect(resultBelow.isErr()).toBe(true);
      expect(resultBelow._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);

      const resultAbove = handler.validate(150.0, undefined, createMeta({ max: 100.0 }));
      expect(resultAbove.isErr()).toBe(true);
      expect(resultAbove._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });
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
});
