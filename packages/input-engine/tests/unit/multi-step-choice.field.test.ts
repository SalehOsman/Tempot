import { describe, it, expect, beforeEach } from 'vitest';
import { MultiStepChoiceFieldHandler } from '../../src/fields/interactive/multi-step-choice.field.js';
import { INPUT_ENGINE_ERRORS } from '../../src/input-engine.errors.js';
import type { FieldMetadata } from '../../src/input-engine.types.js';

function createMeta(overrides: Partial<FieldMetadata> = {}): FieldMetadata {
  return {
    fieldType: 'MultiStepChoice',
    i18nKey: 'test.multiStepChoice',
    ...overrides,
  } as FieldMetadata;
}

describe('MultiStepChoiceFieldHandler', () => {
  let handler: MultiStepChoiceFieldHandler;

  beforeEach(() => {
    handler = new MultiStepChoiceFieldHandler();
  });

  it('has correct fieldType', () => {
    expect(handler.fieldType).toBe('MultiStepChoice');
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
    it('parses value from callback data', () => {
      const message = { callback_query: { data: 'ie:form1:2:electronics' } };
      const result = handler.parseResponse(message, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('electronics');
    });

    it('parses text from message when no callback', () => {
      const message = { text: 'smartphones' };
      const result = handler.parseResponse(message, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('smartphones');
    });

    it('returns err when no callback and no text', () => {
      const result = handler.parseResponse({}, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED);
    });

    it('parses callback value containing colons', () => {
      const message = { callback_query: { data: 'ie:form1:2:cat:sub' } };
      const result = handler.parseResponse(message, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('cat:sub');
    });

    it('returns err when callback data has wrong prefix', () => {
      const message = { callback_query: { data: 'xx:form1:2:val' } };
      const result = handler.parseResponse(message, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED);
    });
  });

  describe('validate', () => {
    it('returns ok for valid non-empty string', () => {
      const result = handler.validate('electronics', undefined, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('electronics');
    });

    it('returns err for empty string', () => {
      const result = handler.validate('', undefined, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });

    it('validates successfully with levels metadata present', () => {
      const meta = createMeta({
        levels: [
          { label: 'level1', options: [{ value: 'a', label: 'A' }] },
          { label: 'level2', options: [{ value: 'b', label: 'B' }] },
        ],
      });
      const result = handler.validate('a', undefined, meta);
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('a');
    });
  });
});
