import { describe, it, expect, beforeEach } from 'vitest';
import { AIExtractorFieldHandler } from '../../src/fields/smart/ai-extractor.field.js';
import { INPUT_ENGINE_ERRORS } from '../../src/input-engine.errors.js';
import type { FieldMetadata } from '../../src/input-engine.types.js';

function createMeta(overrides: Partial<FieldMetadata> = {}): FieldMetadata {
  return {
    fieldType: 'AIExtractorField',
    i18nKey: 'test.aiExtractor',
    ...overrides,
  } as FieldMetadata;
}

describe('AIExtractorFieldHandler', () => {
  let handler: AIExtractorFieldHandler;

  beforeEach(() => {
    handler = new AIExtractorFieldHandler();
  });

  it('has correct fieldType', () => {
    expect(handler.fieldType).toBe('AIExtractorField');
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

  describe('parseResponse', () => {
    it('extracts text from message', () => {
      const result = handler.parseResponse({ text: 'hello world' }, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('hello world');
    });

    it('trims text from message', () => {
      const result = handler.parseResponse({ text: '  hello  ' }, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('hello');
    });

    it('returns err when no text in message', () => {
      const result = handler.parseResponse({}, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED);
    });
  });

  describe('validate', () => {
    it('accepts string value', () => {
      const result = handler.validate('raw text input', undefined, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('raw text input');
    });

    it('accepts object value (extracted data)', () => {
      const extracted = { name: 'John', age: 30 };
      const result = handler.validate(extracted, undefined, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual({ name: 'John', age: 30 });
    });

    it('returns err for empty string', () => {
      const result = handler.validate('', undefined, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });

    it('returns err for null value', () => {
      const result = handler.validate(null, undefined, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });

    it('returns err for undefined value', () => {
      const result = handler.validate(undefined, undefined, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });
  });
});
