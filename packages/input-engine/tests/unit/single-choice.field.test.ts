import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SingleChoiceFieldHandler } from '../../src/fields/choice/single-choice.field.js';
import { INPUT_ENGINE_ERRORS } from '../../src/input-engine.errors.js';
import type { FieldMetadata, ChoiceOption } from '../../src/input-engine.types.js';

function createMeta(overrides: Partial<FieldMetadata> = {}): FieldMetadata {
  return {
    fieldType: 'SingleChoice',
    i18nKey: 'test.singleChoice',
    ...overrides,
  } as FieldMetadata;
}

function createOptions(count: number): ChoiceOption[] {
  return Array.from({ length: count }, (_, i) => ({
    value: `opt_${i}`,
    label: `option.${i}`,
  }));
}

describe('SingleChoiceFieldHandler', () => {
  let handler: SingleChoiceFieldHandler;

  beforeEach(() => {
    handler = new SingleChoiceFieldHandler();
  });

  it('has correct fieldType', () => {
    expect(handler.fieldType).toBe('SingleChoice');
  });

  describe('render', () => {
    it('sends inline keyboard and returns response context', async () => {
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
      expect(mockCtx.reply).toHaveBeenCalledWith(
        meta.i18nKey,
        expect.objectContaining({
          reply_markup: expect.objectContaining({ inline_keyboard: expect.any(Array) }),
        }),
      );
      expect(mockConv.waitFor).toHaveBeenCalledWith('callback_query:data');
    });
  });

  describe('parseResponse', () => {
    it('extracts value from valid callback data', () => {
      const message = { callback_query: { data: 'ie:form1:2:opt_1' } };
      const result = handler.parseResponse(message, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('opt_1');
    });

    it('extracts value with colons in the value part', () => {
      const message = { callback_query: { data: 'ie:form1:2:value:with:colons' } };
      const result = handler.parseResponse(message, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('value:with:colons');
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
    it('returns ok when value is in options', () => {
      const options = createOptions(3);
      const meta = createMeta({ options });
      const result = handler.validate('opt_1', undefined, meta);
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('opt_1');
    });

    it('returns err when value is not in options', () => {
      const options = createOptions(3);
      const meta = createMeta({ options });
      const result = handler.validate('invalid_value', undefined, meta);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });

    it('returns err when options array is empty', () => {
      const meta = createMeta({ options: [] });
      const result = handler.validate('opt_0', undefined, meta);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });

    it('returns err when options is undefined', () => {
      const meta = createMeta();
      const result = handler.validate('opt_0', undefined, meta);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });
  });
});
