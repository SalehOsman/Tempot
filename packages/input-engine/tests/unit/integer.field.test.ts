import { describe, it, expect, beforeEach } from 'vitest';
import { IntegerFieldHandler } from '../../src/fields/numbers/integer.field.js';
import { INPUT_ENGINE_ERRORS } from '../../src/input-engine.errors.js';
import type { FieldMetadata } from '../../src/input-engine.types.js';

function createMeta(overrides: Partial<FieldMetadata> = {}): FieldMetadata {
  return {
    fieldType: 'Integer',
    i18nKey: 'test.integer',
    ...overrides,
  } as FieldMetadata;
}

describe('IntegerFieldHandler', () => {
  let handler: IntegerFieldHandler;

  beforeEach(() => {
    handler = new IntegerFieldHandler();
  });

  it('has correct fieldType', () => {
    expect(handler.fieldType).toBe('Integer');
  });

  describe('parseResponse', () => {
    it('parses valid integer from message text', () => {
      const result = handler.parseResponse({ text: '  42  ' }, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(42);
    });

    it('returns err when no text in message', () => {
      const result = handler.parseResponse({}, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED);
    });
  });

  describe('validate', () => {
    it('returns ok for valid integer', () => {
      const result = handler.validate(42, undefined, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(42);
    });

    it('rejects decimal number', () => {
      const result = handler.validate(3.14, undefined, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });

    it('rejects non-numeric (NaN)', () => {
      const result = handler.validate(NaN, undefined, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });

    it('enforces min boundary', () => {
      const result = handler.validate(3, undefined, createMeta({ min: 5 }));
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });

    it('enforces max boundary', () => {
      const result = handler.validate(15, undefined, createMeta({ max: 10 }));
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });

    it('allows negative integers', () => {
      const result = handler.validate(-7, undefined, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(-7);
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
