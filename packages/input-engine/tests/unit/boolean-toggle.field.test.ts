import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BooleanToggleFieldHandler } from '../../src/fields/choice/boolean-toggle.field.js';
import { INPUT_ENGINE_ERRORS } from '../../src/input-engine.errors.js';
import type { FieldMetadata } from '../../src/input-engine.types.js';

function createMeta(overrides: Partial<FieldMetadata> = {}): FieldMetadata {
  return {
    fieldType: 'BooleanToggle',
    i18nKey: 'test.booleanToggle',
    ...overrides,
  } as FieldMetadata;
}

describe('BooleanToggleFieldHandler', () => {
  let handler: BooleanToggleFieldHandler;

  beforeEach(() => {
    handler = new BooleanToggleFieldHandler();
  });

  it('has correct fieldType', () => {
    expect(handler.fieldType).toBe('BooleanToggle');
  });

  describe('render', () => {
    it('sends inline keyboard with true/false buttons', async () => {
      const mockResponse = { callback_query: { data: 'ie:f1:0:true' } };
      const mockCtx = { reply: vi.fn().mockResolvedValue(undefined) };
      const mockConv = { waitFor: vi.fn().mockResolvedValue(mockResponse) };

      const result = await handler.render(
        { conversation: mockConv, ctx: mockCtx, formData: {}, formId: 'f1', fieldIndex: 0 },
        createMeta(),
      );
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(mockResponse);
      expect(mockCtx.reply).toHaveBeenCalledWith(
        'test.booleanToggle',
        expect.objectContaining({
          reply_markup: expect.objectContaining({ inline_keyboard: expect.any(Array) }),
        }),
      );
      expect(mockConv.waitFor).toHaveBeenCalledWith('callback_query:data');
    });
  });

  describe('parseResponse', () => {
    it('parses true from callback data', () => {
      const message = { callback_query: { data: 'ie:form1:0:true' } };
      const result = handler.parseResponse(message, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(true);
    });

    it('parses false from callback data', () => {
      const message = { callback_query: { data: 'ie:form1:0:false' } };
      const result = handler.parseResponse(message, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(false);
    });

    it('returns err when no callback_query in message', () => {
      const result = handler.parseResponse({}, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED);
    });

    it('returns err when callback data has invalid boolean value', () => {
      const message = { callback_query: { data: 'ie:form1:0:maybe' } };
      const result = handler.parseResponse(message, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED);
    });
  });

  describe('validate', () => {
    it('returns ok for true', () => {
      const result = handler.validate(true, undefined, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(true);
    });

    it('returns ok for false', () => {
      const result = handler.validate(false, undefined, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(false);
    });

    it('returns err for non-boolean value', () => {
      const result = handler.validate('true', undefined, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });
  });
});
