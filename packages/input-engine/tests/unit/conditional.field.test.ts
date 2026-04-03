import { describe, it, expect, beforeEach } from 'vitest';
import { ConditionalFieldHandler } from '../../src/fields/smart/conditional.field.js';
import { INPUT_ENGINE_ERRORS } from '../../src/input-engine.errors.js';
import type { FieldMetadata } from '../../src/input-engine.types.js';

function createMeta(overrides: Partial<FieldMetadata> = {}): FieldMetadata {
  return {
    fieldType: 'ConditionalField',
    i18nKey: 'test.conditional',
    ...overrides,
  } as FieldMetadata;
}

describe('ConditionalFieldHandler', () => {
  let handler: ConditionalFieldHandler;

  beforeEach(() => {
    handler = new ConditionalFieldHandler();
  });

  it('has correct fieldType', () => {
    expect(handler.fieldType).toBe('ConditionalField');
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
    it('passes value through', () => {
      const result = handler.validate('some value', undefined, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('some value');
    });

    it('handles undefined value', () => {
      const result = handler.validate(undefined, undefined, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBeUndefined();
    });
  });
});
