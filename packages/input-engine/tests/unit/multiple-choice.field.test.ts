import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MultipleChoiceFieldHandler } from '../../src/fields/choice/multiple-choice.field.js';
import { INPUT_ENGINE_ERRORS } from '../../src/input-engine.errors.js';
import type { FieldMetadata, ChoiceOption } from '../../src/input-engine.types.js';

function createMeta(overrides: Partial<FieldMetadata> = {}): FieldMetadata {
  return {
    fieldType: 'MultipleChoice',
    i18nKey: 'test.multipleChoice',
    ...overrides,
  } as FieldMetadata;
}

function createOptions(count: number): ChoiceOption[] {
  return Array.from({ length: count }, (_, i) => ({
    value: `opt_${i}`,
    label: `option.${i}`,
  }));
}

describe('MultipleChoiceFieldHandler', () => {
  let handler: MultipleChoiceFieldHandler;

  beforeEach(() => {
    handler = new MultipleChoiceFieldHandler();
  });

  it('has correct fieldType', () => {
    expect(handler.fieldType).toBe('MultipleChoice');
  });

  describe('render', () => {
    it('sends inline keyboard with options', async () => {
      const mockResponse = { callback_query: { data: 'ie:f1:0:opt_0' } };
      const mockCtx = { reply: vi.fn().mockResolvedValue(undefined) };
      const mockConv = { waitFor: vi.fn().mockResolvedValue(mockResponse) };
      const options = createOptions(2);
      const meta = createMeta({ options });

      const result = await handler.render(
        { conversation: mockConv, ctx: mockCtx, formData: {}, formId: 'f1', fieldIndex: 0 },
        meta,
      );
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(mockResponse);
      expect(mockConv.waitFor).toHaveBeenCalledWith('callback_query:data');
    });
  });

  describe('parseResponse', () => {
    it('extracts comma-separated values from valid callback data', () => {
      const message = { callback_query: { data: 'ie:form1:2:opt_1,opt_3,opt_5' } };
      const result = handler.parseResponse(message, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(['opt_1', 'opt_3', 'opt_5']);
    });

    it('extracts single value as array', () => {
      const message = { callback_query: { data: 'ie:form1:2:opt_1' } };
      const result = handler.parseResponse(message, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(['opt_1']);
    });

    it('returns err when no callback_query in message', () => {
      const result = handler.parseResponse({}, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED);
    });

    it('returns err when callback_query has no data', () => {
      const result = handler.parseResponse({ callback_query: {} }, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED);
    });
  });

  describe('validate', () => {
    it('returns ok when all values are in options', () => {
      const options = createOptions(5);
      const meta = createMeta({ options });
      const result = handler.validate(['opt_1', 'opt_3'], undefined, meta);
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(['opt_1', 'opt_3']);
    });

    it('returns err when a value is not in options', () => {
      const options = createOptions(3);
      const meta = createMeta({ options });
      const result = handler.validate(['opt_1', 'invalid'], undefined, meta);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });

    it('returns err when below minSelections', () => {
      const options = createOptions(5);
      const meta = createMeta({ options, minSelections: 2 });
      const result = handler.validate(['opt_1'], undefined, meta);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });

    it('returns err when above maxSelections', () => {
      const options = createOptions(5);
      const meta = createMeta({ options, maxSelections: 2 });
      const result = handler.validate(['opt_0', 'opt_1', 'opt_2'], undefined, meta);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });

    it('returns err when value is not an array', () => {
      const options = createOptions(3);
      const meta = createMeta({ options });
      const result = handler.validate('opt_1', undefined, meta);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });

    it('returns err when array is empty (default minSelections=1)', () => {
      const options = createOptions(3);
      const meta = createMeta({ options });
      const result = handler.validate([], undefined, meta);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });
  });
});
