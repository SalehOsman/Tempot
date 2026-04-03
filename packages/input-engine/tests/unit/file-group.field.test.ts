import { describe, it, expect, beforeEach } from 'vitest';
import { FileGroupFieldHandler } from '../../src/fields/media/file-group.field.js';
import { INPUT_ENGINE_ERRORS } from '../../src/input-engine.errors.js';
import type { FieldMetadata } from '../../src/input-engine.types.js';

function createMeta(overrides: Partial<FieldMetadata> = {}): FieldMetadata {
  return {
    fieldType: 'FileGroup',
    i18nKey: 'test.fileGroup',
    ...overrides,
  } as FieldMetadata;
}

describe('FileGroupFieldHandler', () => {
  let handler: FileGroupFieldHandler;

  beforeEach(() => {
    handler = new FileGroupFieldHandler();
  });

  it('has correct fieldType', () => {
    expect(handler.fieldType).toBe('FileGroup');
  });

  describe('parseResponse', () => {
    it('extracts document info from message', () => {
      const message = {
        document: {
          file_id: 'doc1',
          file_name: 'file.pdf',
          file_size: 1024,
          mime_type: 'application/pdf',
        },
      };
      const result = handler.parseResponse(message, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual({
        fileId: 'doc1',
        fileName: 'file.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
      });
    });

    it('extracts photo info from message when no document', () => {
      const message = {
        photo: [
          { file_id: 'small', file_unique_id: 'u1', width: 90, height: 90 },
          { file_id: 'large', file_unique_id: 'u2', file_size: 5000, width: 800, height: 800 },
        ],
      };
      const result = handler.parseResponse(message, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual({ fileId: 'large', fileSize: 5000 });
    });

    it('returns err when no file in message', () => {
      const result = handler.parseResponse({}, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED);
    });
  });

  describe('validate', () => {
    it('returns ok for valid file array', () => {
      const value = [
        { fileId: 'f1', fileSize: 1024 },
        { fileId: 'f2', fileSize: 2048 },
      ];
      const result = handler.validate(value, undefined, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(value);
    });

    it('returns err when below minFiles', () => {
      const value = [{ fileId: 'f1', fileSize: 1024 }];
      const result = handler.validate(value, undefined, createMeta({ minFiles: 2 }));
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });

    it('returns err when above maxFiles', () => {
      const value = [
        { fileId: 'f1', fileSize: 1024 },
        { fileId: 'f2', fileSize: 1024 },
        { fileId: 'f3', fileSize: 1024 },
      ];
      const result = handler.validate(value, undefined, createMeta({ maxFiles: 2 }));
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });

    it('returns err when a file exceeds maxSizeKB', () => {
      const value = [
        { fileId: 'f1', fileSize: 1024 },
        { fileId: 'f2', fileSize: 6_000_000 },
      ];
      const result = handler.validate(value, undefined, createMeta({ maxSizeKB: 5000 }));
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.MEDIA_SIZE_EXCEEDED);
    });

    it('returns err for empty array', () => {
      const result = handler.validate([], undefined, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED);
    });
  });
});
