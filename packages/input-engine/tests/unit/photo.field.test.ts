import { describe, it, expect, beforeEach } from 'vitest';
import { PhotoFieldHandler } from '../../src/fields/media/photo.field.js';
import { INPUT_ENGINE_ERRORS } from '../../src/input-engine.errors.js';
import type { FieldMetadata } from '../../src/input-engine.types.js';

function createMeta(overrides: Partial<FieldMetadata> = {}): FieldMetadata {
  return {
    fieldType: 'Photo',
    i18nKey: 'test.photo',
    ...overrides,
  } as FieldMetadata;
}

describe('PhotoFieldHandler', () => {
  let handler: PhotoFieldHandler;

  beforeEach(() => {
    handler = new PhotoFieldHandler();
  });

  it('has correct fieldType', () => {
    expect(handler.fieldType).toBe('Photo');
  });

  describe('parseResponse', () => {
    it('extracts largest photo (last element) from photo array', () => {
      const message = {
        photo: [
          { file_id: 'small', file_unique_id: 'u1', width: 90, height: 90 },
          { file_id: 'medium', file_unique_id: 'u2', width: 320, height: 320 },
          { file_id: 'large', file_unique_id: 'u3', file_size: 50000, width: 800, height: 800 },
        ],
      };
      const result = handler.parseResponse(message, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual({ fileId: 'large', fileSize: 50000 });
    });

    it('returns err when no photo in message', () => {
      const result = handler.parseResponse({}, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED);
    });
  });

  describe('validate', () => {
    it('returns ok for valid photo value', () => {
      const value = { fileId: 'abc123', fileSize: 1024 };
      const result = handler.validate(value, undefined, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(value);
    });

    it('returns err when file size exceeds maxSizeKB', () => {
      const value = { fileId: 'abc123', fileSize: 6_000_000 };
      const result = handler.validate(value, undefined, createMeta({ maxSizeKB: 5000 }));
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.MEDIA_SIZE_EXCEEDED);
    });

    it('returns ok when no maxSizeKB constraint is set', () => {
      const value = { fileId: 'abc123', fileSize: 999_999_999 };
      const result = handler.validate(value, undefined, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(value);
    });
  });
});
