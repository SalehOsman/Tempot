import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StarRatingFieldHandler } from '../../src/fields/interactive/star-rating.field.js';
import { INPUT_ENGINE_ERRORS } from '../../src/input-engine.errors.js';
import type { FieldMetadata } from '../../src/input-engine.types.js';

function createMeta(overrides: Partial<FieldMetadata> = {}): FieldMetadata {
  return {
    fieldType: 'StarRating',
    i18nKey: 'test.starRating',
    ...overrides,
  } as FieldMetadata;
}

describe('StarRatingFieldHandler', () => {
  let handler: StarRatingFieldHandler;

  beforeEach(() => {
    handler = new StarRatingFieldHandler();
  });

  it('has correct fieldType', () => {
    expect(handler.fieldType).toBe('StarRating');
  });

  describe('render', () => {
    it('sends star rating buttons as inline keyboard', async () => {
      const mockResponse = { callback_query: { data: 'ie:f1:0:3' } };
      const mockCtx = { reply: vi.fn().mockResolvedValue(undefined) };
      const mockConv = { waitFor: vi.fn().mockResolvedValue(mockResponse) };

      const result = await handler.render(
        { conversation: mockConv, ctx: mockCtx, formData: {}, formId: 'f1', fieldIndex: 0 },
        createMeta(),
      );
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(mockResponse);
      expect(mockCtx.reply).toHaveBeenCalledWith(
        'test.starRating',
        expect.objectContaining({
          reply_markup: expect.objectContaining({ inline_keyboard: expect.any(Array) }),
        }),
      );
      expect(mockConv.waitFor).toHaveBeenCalledWith('callback_query:data');
    });
  });

  describe('parseResponse', () => {
    it('parses rating number from callback data', () => {
      const message = { callback_query: { data: 'ie:form1:0:3' } };
      const result = handler.parseResponse(message, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(3);
    });

    it('returns err when no callback_query in message', () => {
      const result = handler.parseResponse({}, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED);
    });

    it('returns err when callback value is not a number', () => {
      const message = { callback_query: { data: 'ie:form1:0:abc' } };
      const result = handler.parseResponse(message, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED);
    });

    it('returns err when callback data has wrong prefix', () => {
      const message = { callback_query: { data: 'xx:form1:0:3' } };
      const result = handler.parseResponse(message, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED);
    });
  });

  describe('validate', () => {
    it('returns ok for rating within default range (1-5)', () => {
      const result = handler.validate(3, undefined, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(3);
    });

    it('returns ok for rating at min boundary', () => {
      const result = handler.validate(1, undefined, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(1);
    });

    it('returns ok for rating at max boundary', () => {
      const result = handler.validate(5, undefined, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(5);
    });

    it('returns err when rating is below min', () => {
      const result = handler.validate(0, undefined, createMeta({ min: 1, max: 5 }));
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });

    it('returns err when rating is above max', () => {
      const result = handler.validate(6, undefined, createMeta({ min: 1, max: 5 }));
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });

    it('returns err when rating is not an integer', () => {
      const result = handler.validate(3.5, undefined, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });

    it('validates against custom min/max', () => {
      const result = handler.validate(8, undefined, createMeta({ min: 1, max: 10 }));
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(8);
    });
  });
});
