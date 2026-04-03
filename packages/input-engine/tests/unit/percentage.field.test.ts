import { describe, it, expect, beforeEach } from 'vitest';
import { PercentageFieldHandler } from '../../src/fields/numbers/percentage.field.js';
import { INPUT_ENGINE_ERRORS } from '../../src/input-engine.errors.js';
import type { FieldMetadata } from '../../src/input-engine.types.js';

function createMeta(overrides: Partial<FieldMetadata> = {}): FieldMetadata {
  return {
    fieldType: 'Percentage',
    i18nKey: 'test.percentage',
    ...overrides,
  } as FieldMetadata;
}

describe('PercentageFieldHandler', () => {
  let handler: PercentageFieldHandler;

  beforeEach(() => {
    handler = new PercentageFieldHandler();
  });

  it('has correct fieldType', () => {
    expect(handler.fieldType).toBe('Percentage');
  });

  describe('parseResponse', () => {
    it('parses valid percentage from message text', () => {
      const result = handler.parseResponse({ text: '50' }, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(50);
    });

    it('strips trailing % sign', () => {
      const result = handler.parseResponse({ text: '75%' }, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(75);
    });

    it('returns err when no text in message', () => {
      const result = handler.parseResponse({}, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED);
    });
  });

  describe('validate', () => {
    it('returns ok for valid percentage', () => {
      const result = handler.validate(50, undefined, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(50);
    });

    it('rejects value below 0', () => {
      const result = handler.validate(-1, undefined, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });

    it('rejects value above 100', () => {
      const result = handler.validate(101, undefined, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });

    it('allows metadata min/max to override default 0-100 range', () => {
      const result = handler.validate(80, undefined, createMeta({ min: 10, max: 90 }));
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(80);

      const resultBelow = handler.validate(5, undefined, createMeta({ min: 10 }));
      expect(resultBelow.isErr()).toBe(true);

      const resultAbove = handler.validate(95, undefined, createMeta({ max: 90 }));
      expect(resultAbove.isErr()).toBe(true);
    });

    it('rejects NaN', () => {
      const result = handler.validate(NaN, undefined, createMeta());
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
