import { describe, it, expect, beforeEach } from 'vitest';
import { LongTextFieldHandler } from '../../src/fields/text/long-text.field.js';
import { INPUT_ENGINE_ERRORS } from '../../src/input-engine.errors.js';
import type { FieldMetadata } from '../../src/input-engine.types.js';

function createMeta(overrides: Partial<FieldMetadata> = {}): FieldMetadata {
  return {
    fieldType: 'LongText',
    i18nKey: 'test.longText',
    ...overrides,
  } as FieldMetadata;
}

describe('LongTextFieldHandler', () => {
  let handler: LongTextFieldHandler;

  beforeEach(() => {
    handler = new LongTextFieldHandler();
  });

  it('has correct fieldType', () => {
    expect(handler.fieldType).toBe('LongText');
  });

  describe('parseResponse', () => {
    it('extracts and trims text from message', () => {
      const result = handler.parseResponse({ text: '  long text here  ' }, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('long text here');
    });

    it('returns err when no text in message', () => {
      const result = handler.parseResponse({}, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED);
    });
  });

  describe('validate', () => {
    it('returns ok for valid input within default bounds', () => {
      const result = handler.validate('hello world', undefined, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('hello world');
    });

    it('returns err when input is too short (minLength > 1)', () => {
      const result = handler.validate('ab', undefined, createMeta({ minLength: 5 }));
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });

    it('returns err when input exceeds maxLength (4096)', () => {
      const longString = 'a'.repeat(4097);
      const result = handler.validate(longString, undefined, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });

    it('returns err for empty input (default minLength = 1)', () => {
      const result = handler.validate('', undefined, createMeta());
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
