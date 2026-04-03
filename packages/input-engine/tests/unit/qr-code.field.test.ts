import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QRCodeFieldHandler } from '../../src/fields/interactive/qr-code.field.js';
import { INPUT_ENGINE_ERRORS } from '../../src/input-engine.errors.js';
import type { FieldMetadata } from '../../src/input-engine.types.js';

function createMeta(overrides: Partial<FieldMetadata> = {}): FieldMetadata {
  return {
    fieldType: 'QRCode',
    i18nKey: 'test.qrCode',
    ...overrides,
  } as FieldMetadata;
}

describe('QRCodeFieldHandler', () => {
  let handler: QRCodeFieldHandler;

  beforeEach(() => {
    handler = new QRCodeFieldHandler();
  });

  it('has correct fieldType', () => {
    expect(handler.fieldType).toBe('QRCode');
  });

  describe('render', () => {
    it('sends prompt and waits for photo', async () => {
      const mockResponse = { photo: [{ file_id: 'abc' }] };
      const mockCtx = { reply: vi.fn().mockResolvedValue(undefined) };
      const mockConv = { waitFor: vi.fn().mockResolvedValue(mockResponse) };

      const result = await handler.render(
        { conversation: mockConv, ctx: mockCtx, formData: {}, formId: 'f1', fieldIndex: 0 },
        createMeta(),
      );
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(mockResponse);
      expect(mockCtx.reply).toHaveBeenCalledWith('test.qrCode');
      expect(mockConv.waitFor).toHaveBeenCalledWith('message:photo');
    });
  });

  describe('parseResponse', () => {
    it('extracts text from message', () => {
      const message = { text: 'https://example.com/data' };
      const result = handler.parseResponse(message, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('https://example.com/data');
    });

    it('returns err when no text in message', () => {
      const result = handler.parseResponse({}, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED);
    });
  });

  describe('validate', () => {
    it('returns ok for valid URL format', () => {
      const result = handler.validate(
        'https://example.com',
        undefined,
        createMeta({ expectedFormat: 'url' }),
      );
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('https://example.com');
    });

    it('returns ok for http URL format', () => {
      const result = handler.validate(
        'http://example.com',
        undefined,
        createMeta({ expectedFormat: 'url' }),
      );
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('http://example.com');
    });

    it('returns err for URL format mismatch', () => {
      const result = handler.validate(
        'not-a-url',
        undefined,
        createMeta({ expectedFormat: 'url' }),
      );
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.QR_FORMAT_MISMATCH);
    });

    it('returns ok for valid JSON format', () => {
      const result = handler.validate(
        '{"key":"value"}',
        undefined,
        createMeta({ expectedFormat: 'json' }),
      );
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('{"key":"value"}');
    });

    it('returns err for invalid JSON format', () => {
      const result = handler.validate(
        '{invalid json',
        undefined,
        createMeta({ expectedFormat: 'json' }),
      );
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.QR_FORMAT_MISMATCH);
    });

    it('returns ok for text format with non-empty string', () => {
      const result = handler.validate(
        'some text data',
        undefined,
        createMeta({ expectedFormat: 'text' }),
      );
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('some text data');
    });

    it('returns ok for any format with non-empty string', () => {
      const result = handler.validate('anything', undefined, createMeta({ expectedFormat: 'any' }));
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('anything');
    });

    it('returns ok when expectedFormat is undefined', () => {
      const result = handler.validate('anything', undefined, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe('anything');
    });

    it('returns err for empty string (QR_DECODE_FAILED)', () => {
      const result = handler.validate('', undefined, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.QR_DECODE_FAILED);
    });
  });
});
