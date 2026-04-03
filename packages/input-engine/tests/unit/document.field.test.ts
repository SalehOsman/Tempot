import { describe, it, expect, beforeEach } from 'vitest';
import { DocumentFieldHandler } from '../../src/fields/media/document.field.js';
import { INPUT_ENGINE_ERRORS } from '../../src/input-engine.errors.js';
import type { FieldMetadata } from '../../src/input-engine.types.js';

function createMeta(overrides: Partial<FieldMetadata> = {}): FieldMetadata {
  return {
    fieldType: 'Document',
    i18nKey: 'test.document',
    ...overrides,
  } as FieldMetadata;
}

describe('DocumentFieldHandler', () => {
  let handler: DocumentFieldHandler;

  beforeEach(() => {
    handler = new DocumentFieldHandler();
  });

  it('has correct fieldType', () => {
    expect(handler.fieldType).toBe('Document');
  });

  describe('parseResponse', () => {
    it('extracts document info from message', () => {
      const message = {
        document: {
          file_id: 'doc123',
          file_name: 'report.pdf',
          file_size: 2048,
          mime_type: 'application/pdf',
        },
      };
      const result = handler.parseResponse(message, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual({
        fileId: 'doc123',
        fileName: 'report.pdf',
        fileSize: 2048,
        mimeType: 'application/pdf',
      });
    });

    it('returns err when no document in message', () => {
      const result = handler.parseResponse({}, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED);
    });
  });

  describe('validate', () => {
    it('returns ok for valid document value', () => {
      const value = { fileId: 'doc123', fileName: 'report.pdf', fileSize: 2048 };
      const result = handler.validate(value, undefined, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(value);
    });

    it('returns err when extension is not allowed', () => {
      const value = { fileId: 'doc123', fileName: 'virus.exe', fileSize: 2048 };
      const result = handler.validate(
        value,
        undefined,
        createMeta({ allowedExtensions: ['.pdf', '.docx'] }),
      );
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.MEDIA_TYPE_NOT_ALLOWED);
    });

    it('returns err when file size exceeds maxSizeKB', () => {
      const value = { fileId: 'doc123', fileName: 'big.pdf', fileSize: 6_000_000 };
      const result = handler.validate(value, undefined, createMeta({ maxSizeKB: 5000 }));
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.MEDIA_SIZE_EXCEEDED);
    });
  });
});
