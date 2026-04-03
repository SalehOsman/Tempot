import { describe, it, expect, beforeEach } from 'vitest';
import { FloatFieldHandler } from '../../src/fields/numbers/float.field.js';
import { INPUT_ENGINE_ERRORS } from '../../src/input-engine.errors.js';
import type { FieldMetadata } from '../../src/input-engine.types.js';

function createMeta(overrides: Partial<FieldMetadata> = {}): FieldMetadata {
  return {
    fieldType: 'Float',
    i18nKey: 'test.float',
    ...overrides,
  } as FieldMetadata;
}

describe('FloatFieldHandler', () => {
  let handler: FloatFieldHandler;

  beforeEach(() => {
    handler = new FloatFieldHandler();
  });

  it('has correct fieldType', () => {
    expect(handler.fieldType).toBe('Float');
  });

  describe('parseResponse', () => {
    it('parses valid float from message text', () => {
      const result = handler.parseResponse({ text: '  3.14  ' }, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBeCloseTo(3.14);
    });

    it('returns err when no text in message', () => {
      const result = handler.parseResponse({}, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED);
    });
  });

  describe('validate', () => {
    it('returns ok for valid float', () => {
      const result = handler.validate(3.14, undefined, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBeCloseTo(3.14);
    });

    it('rejects NaN', () => {
      const result = handler.validate(NaN, undefined, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });

    it('rejects Infinity', () => {
      const result = handler.validate(Infinity, undefined, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });

    it('enforces min/max boundaries', () => {
      const resultBelow = handler.validate(1.5, undefined, createMeta({ min: 2.0 }));
      expect(resultBelow.isErr()).toBe(true);
      expect(resultBelow._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);

      const resultAbove = handler.validate(10.5, undefined, createMeta({ max: 10.0 }));
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
