import { describe, it, expect, beforeEach } from 'vitest';
import { CurrencyAmountFieldHandler } from '../../src/fields/numbers/currency-amount.field.js';
import { INPUT_ENGINE_ERRORS } from '../../src/input-engine.errors.js';
import type { FieldMetadata, CurrencyAmountResult } from '../../src/input-engine.types.js';

function createMeta(overrides: Partial<FieldMetadata> = {}): FieldMetadata {
  return {
    fieldType: 'CurrencyAmount',
    i18nKey: 'test.currencyAmount',
    currency: 'EGP',
    ...overrides,
  } as FieldMetadata;
}

describe('CurrencyAmountFieldHandler', () => {
  let handler: CurrencyAmountFieldHandler;

  beforeEach(() => {
    handler = new CurrencyAmountFieldHandler();
  });

  it('has correct fieldType', () => {
    expect(handler.fieldType).toBe('CurrencyAmount');
  });

  describe('parseResponse', () => {
    it('parses amount with default currency from metadata', () => {
      const result = handler.parseResponse({ text: '150.50' }, createMeta());
      expect(result.isOk()).toBe(true);
      const parsed = result._unsafeUnwrap() as { amount: number; currency: string };
      expect(parsed.amount).toBeCloseTo(150.5);
      expect(parsed.currency).toBe('EGP');
    });

    it('parses amount with currency code in text', () => {
      const result = handler.parseResponse({ text: '150.50 USD' }, createMeta());
      expect(result.isOk()).toBe(true);
      const parsed = result._unsafeUnwrap() as { amount: number; currency: string };
      expect(parsed.amount).toBeCloseTo(150.5);
      expect(parsed.currency).toBe('USD');
    });

    it('normalizes Arabic numerals', () => {
      const result = handler.parseResponse({ text: '١٥٠.٥٠' }, createMeta());
      expect(result.isOk()).toBe(true);
      const parsed = result._unsafeUnwrap() as { amount: number; currency: string };
      expect(parsed.amount).toBeCloseTo(150.5);
    });

    it('returns err when no text in message', () => {
      const result = handler.parseResponse({}, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED);
    });
  });

  describe('validate', () => {
    it('returns ok for valid amount with correct decimal places', () => {
      const input: CurrencyAmountResult = { amount: 150.5, currency: 'EGP' };
      const result = handler.validate(input, undefined, createMeta());
      expect(result.isOk()).toBe(true);
      const validated = result._unsafeUnwrap() as CurrencyAmountResult;
      expect(validated.amount).toBeCloseTo(150.5);
      expect(validated.currency).toBe('EGP');
    });

    it('rejects invalid currency when allowedCurrencies is set', () => {
      const input: CurrencyAmountResult = { amount: 100.0, currency: 'JPY' };
      const result = handler.validate(
        input,
        undefined,
        createMeta({ allowedCurrencies: ['EGP', 'USD', 'EUR'] }),
      );
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });

    it('rejects too many decimal places', () => {
      const input: CurrencyAmountResult = { amount: 99.999, currency: 'EGP' };
      const result = handler.validate(input, undefined, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });

    it('rejects negative amount', () => {
      const input: CurrencyAmountResult = { amount: -50.0, currency: 'EGP' };
      const result = handler.validate(input, undefined, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });

    it('respects custom decimalPlaces from metadata', () => {
      const input: CurrencyAmountResult = { amount: 99.999, currency: 'KWD' };
      const result = handler.validate(input, undefined, createMeta({ decimalPlaces: 3 }));
      expect(result.isOk()).toBe(true);
      const validated = result._unsafeUnwrap() as CurrencyAmountResult;
      expect(validated.amount).toBeCloseTo(99.999);
    });

    it('rejects NaN amount', () => {
      const input: CurrencyAmountResult = { amount: NaN, currency: 'EGP' };
      const result = handler.validate(input, undefined, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
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
