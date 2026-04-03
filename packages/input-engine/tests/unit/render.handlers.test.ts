import { describe, it, expect, vi } from 'vitest';
import { SingleChoiceFieldHandler } from '../../src/fields/choice/single-choice.field.js';
import { PhotoFieldHandler } from '../../src/fields/media/photo.field.js';
import { StarRatingFieldHandler } from '../../src/fields/interactive/star-rating.field.js';
import { GeoAddressFieldHandler } from '../../src/fields/geo/geo-address.field.js';
import { DatePickerFieldHandler } from '../../src/fields/time-place/date-picker.field.js';
import type { RenderContext } from '../../src/fields/field.handler.js';
import type { FieldMetadata } from '../../src/input-engine.types.js';
import { INPUT_ENGINE_ERRORS } from '../../src/input-engine.errors.js';

function createRenderCtx(overrides: Partial<RenderContext> = {}): RenderContext {
  return {
    conversation: { waitFor: vi.fn().mockResolvedValue({}) },
    ctx: { reply: vi.fn().mockResolvedValue(undefined) },
    formData: {},
    formId: 'test-form',
    fieldIndex: 0,
    ...overrides,
  };
}

describe('Render handlers', () => {
  describe('SingleChoice render sends inline keyboard', () => {
    it('calls ctx.reply with inline_keyboard and waits for callback', async () => {
      const mockResponse = { callback_query: { data: 'ie:test-form:0:opt_a' } };
      const mockCtx = { reply: vi.fn().mockResolvedValue(undefined) };
      const mockConv = { waitFor: vi.fn().mockResolvedValue(mockResponse) };
      const renderCtx = createRenderCtx({ ctx: mockCtx, conversation: mockConv });
      const meta: FieldMetadata = {
        fieldType: 'SingleChoice',
        i18nKey: 'form.choose',
        options: [
          { value: 'opt_a', label: 'Option A' },
          { value: 'opt_b', label: 'Option B' },
        ],
      };

      const handler = new SingleChoiceFieldHandler();
      const result = await handler.render(renderCtx, meta);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(mockResponse);

      const replyCall = mockCtx.reply.mock.calls[0] as unknown[];
      expect(replyCall[0]).toBe('form.choose');
      const markup = (replyCall[1] as Record<string, unknown>).reply_markup as Record<
        string,
        unknown
      >;
      const keyboard = markup.inline_keyboard as Array<
        Array<{ text: string; callback_data: string }>
      >;
      expect(keyboard).toHaveLength(2);
      expect(keyboard[0][0].callback_data).toBe('ie:test-form:0:opt_a');
      expect(keyboard[1][0].callback_data).toBe('ie:test-form:0:opt_b');
    });

    it('returns FIELD_RENDER_FAILED on error', async () => {
      const renderCtx = createRenderCtx({
        ctx: { reply: vi.fn().mockRejectedValue(new Error('network')) },
      });
      const meta: FieldMetadata = { fieldType: 'SingleChoice', i18nKey: 'form.choose' };

      const handler = new SingleChoiceFieldHandler();
      const result = await handler.render(renderCtx, meta);

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_RENDER_FAILED);
    });
  });

  describe('PhotoField render waits for photo', () => {
    it('calls ctx.reply with prompt and waits for message:photo', async () => {
      const mockResponse = {
        photo: [{ file_id: 'abc', file_unique_id: 'u1', width: 100, height: 100 }],
      };
      const mockCtx = { reply: vi.fn().mockResolvedValue(undefined) };
      const mockConv = { waitFor: vi.fn().mockResolvedValue(mockResponse) };
      const renderCtx = createRenderCtx({ ctx: mockCtx, conversation: mockConv });
      const meta: FieldMetadata = { fieldType: 'Photo', i18nKey: 'form.uploadPhoto' };

      const handler = new PhotoFieldHandler();
      const result = await handler.render(renderCtx, meta);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(mockResponse);
      expect(mockCtx.reply).toHaveBeenCalledWith('form.uploadPhoto');
      expect(mockConv.waitFor).toHaveBeenCalledWith('message:photo');
    });
  });

  describe('StarRating render shows rating buttons', () => {
    it('creates inline keyboard with star buttons for default 1-5 range', async () => {
      const mockResponse = { callback_query: { data: 'ie:test-form:0:3' } };
      const mockCtx = { reply: vi.fn().mockResolvedValue(undefined) };
      const mockConv = { waitFor: vi.fn().mockResolvedValue(mockResponse) };
      const renderCtx = createRenderCtx({ ctx: mockCtx, conversation: mockConv });
      const meta: FieldMetadata = { fieldType: 'StarRating', i18nKey: 'form.rate' };

      const handler = new StarRatingFieldHandler();
      const result = await handler.render(renderCtx, meta);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(mockResponse);

      const replyCall = mockCtx.reply.mock.calls[0] as unknown[];
      const markup = (replyCall[1] as Record<string, unknown>).reply_markup as Record<
        string,
        unknown
      >;
      const keyboard = markup.inline_keyboard as Array<
        Array<{ text: string; callback_data: string }>
      >;
      // Single row with 5 buttons (default min=1, max=5)
      expect(keyboard).toHaveLength(1);
      expect(keyboard[0]).toHaveLength(5);
      expect(keyboard[0][0].callback_data).toBe('ie:test-form:0:1');
      expect(keyboard[0][4].callback_data).toBe('ie:test-form:0:5');
    });
  });

  describe('GeoAddress render requests location', () => {
    it('sends reply keyboard with request_location', async () => {
      const mockResponse = { location: { latitude: 30.0, longitude: 31.0 } };
      const mockCtx = { reply: vi.fn().mockResolvedValue(undefined) };
      const mockConv = { waitFor: vi.fn().mockResolvedValue(mockResponse) };
      const renderCtx = createRenderCtx({ ctx: mockCtx, conversation: mockConv });
      const meta: FieldMetadata = { fieldType: 'GeoAddressField', i18nKey: 'form.shareLocation' };

      const handler = new GeoAddressFieldHandler();
      const result = await handler.render(renderCtx, meta);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(mockResponse);

      const replyCall = mockCtx.reply.mock.calls[0] as unknown[];
      const markup = (replyCall[1] as Record<string, unknown>).reply_markup as Record<
        string,
        unknown
      >;
      const keyboard = markup.keyboard as Array<Array<Record<string, unknown>>>;
      expect(keyboard[0][0].request_location).toBe(true);
      expect(mockConv.waitFor).toHaveBeenCalledWith('message:location');
    });
  });

  describe('DatePicker render sends prompt', () => {
    it('calls ctx.reply with i18n key and waits for text', async () => {
      const mockResponse = { text: '2025-06-15' };
      const mockCtx = { reply: vi.fn().mockResolvedValue(undefined) };
      const mockConv = { waitFor: vi.fn().mockResolvedValue(mockResponse) };
      const renderCtx = createRenderCtx({ ctx: mockCtx, conversation: mockConv });
      const meta: FieldMetadata = { fieldType: 'DatePicker', i18nKey: 'form.pickDate' };

      const handler = new DatePickerFieldHandler();
      const result = await handler.render(renderCtx, meta);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(mockResponse);
      expect(mockCtx.reply).toHaveBeenCalledWith('form.pickDate');
      expect(mockConv.waitFor).toHaveBeenCalledWith('message:text');
    });
  });
});
