import { describe, it, expect, beforeEach } from 'vitest';
import { TagsFieldHandler } from '../../src/fields/interactive/tags.field.js';
import { INPUT_ENGINE_ERRORS } from '../../src/input-engine.errors.js';
import type { FieldMetadata } from '../../src/input-engine.types.js';

function createMeta(overrides: Partial<FieldMetadata> = {}): FieldMetadata {
  return {
    fieldType: 'Tags',
    i18nKey: 'test.tags',
    ...overrides,
  } as FieldMetadata;
}

describe('TagsFieldHandler', () => {
  let handler: TagsFieldHandler;

  beforeEach(() => {
    handler = new TagsFieldHandler();
  });

  it('has correct fieldType', () => {
    expect(handler.fieldType).toBe('Tags');
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
    it('extracts text from message as tag', () => {
      const message = { text: 'typescript' };
      const result = handler.parseResponse(message, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('typescript');
    });

    it('trims whitespace from text', () => {
      const message = { text: '  javascript  ' };
      const result = handler.parseResponse(message, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('javascript');
    });

    it('returns err when no text in message', () => {
      const result = handler.parseResponse({}, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED);
    });
  });

  describe('validate', () => {
    it('returns ok for valid tags array', () => {
      const result = handler.validate(
        ['typescript', 'javascript', 'rust'],
        undefined,
        createMeta(),
      );
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(['typescript', 'javascript', 'rust']);
    });

    it('returns err when tags count is below minTags', () => {
      const result = handler.validate(['one'], undefined, createMeta({ minTags: 2 }));
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });

    it('returns err when tags count exceeds maxTags', () => {
      const result = handler.validate(['a', 'b', 'c', 'd'], undefined, createMeta({ maxTags: 3 }));
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });

    it('returns err for duplicate tags (case-insensitive)', () => {
      const result = handler.validate(['TypeScript', 'typescript'], undefined, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.TAGS_DUPLICATE);
    });

    it('returns err when tag exceeds maxTagLength', () => {
      const longTag = 'a'.repeat(51);
      const result = handler.validate([longTag], undefined, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.TAGS_MAX_LENGTH);
    });

    it('returns err when tag exceeds custom maxTagLength', () => {
      const result = handler.validate(['toolong'], undefined, createMeta({ maxTagLength: 5 }));
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.TAGS_MAX_LENGTH);
    });

    it('returns ok for empty array when minTags is 0', () => {
      const result = handler.validate([], undefined, createMeta({ minTags: 0 }));
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual([]);
    });

    it('returns ok for empty array when minTags is not set (default 0)', () => {
      const result = handler.validate([], undefined, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual([]);
    });

    it('returns err when value is not an array', () => {
      const result = handler.validate('not-array', undefined, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });
  });
});
