import { describe, it, expect, beforeEach } from 'vitest';
import { AudioFieldHandler } from '../../src/fields/media/audio.field.js';
import { INPUT_ENGINE_ERRORS } from '../../src/input-engine.errors.js';
import type { FieldMetadata } from '../../src/input-engine.types.js';

function createMeta(overrides: Partial<FieldMetadata> = {}): FieldMetadata {
  return {
    fieldType: 'Audio',
    i18nKey: 'test.audio',
    ...overrides,
  } as FieldMetadata;
}

describe('AudioFieldHandler', () => {
  let handler: AudioFieldHandler;

  beforeEach(() => {
    handler = new AudioFieldHandler();
  });

  it('has correct fieldType', () => {
    expect(handler.fieldType).toBe('Audio');
  });

  describe('parseResponse', () => {
    it('extracts audio info from message', () => {
      const message = {
        audio: { file_id: 'aud123', file_size: 8000, duration: 180 },
      };
      const result = handler.parseResponse(message, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual({
        fileId: 'aud123',
        fileSize: 8000,
        duration: 180,
      });
    });

    it('returns err when no audio in message', () => {
      const result = handler.parseResponse({}, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED);
    });
  });

  describe('validate', () => {
    it('returns ok for valid audio value', () => {
      const value = { fileId: 'aud123', fileSize: 1024, duration: 60 };
      const result = handler.validate(value, undefined, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(value);
    });

    it('returns err when duration exceeds maxDurationSeconds', () => {
      const value = { fileId: 'aud123', fileSize: 1024, duration: 300 };
      const result = handler.validate(value, undefined, createMeta({ maxDurationSeconds: 120 }));
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.MEDIA_DURATION_EXCEEDED);
    });

    it('returns err when file size exceeds maxSizeKB', () => {
      const value = { fileId: 'aud123', fileSize: 6_000_000, duration: 60 };
      const result = handler.validate(value, undefined, createMeta({ maxSizeKB: 5000 }));
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.MEDIA_SIZE_EXCEEDED);
    });
  });
});
