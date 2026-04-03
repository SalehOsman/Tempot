import { describe, it, expect, beforeEach } from 'vitest';
import { VideoFieldHandler } from '../../src/fields/media/video.field.js';
import { INPUT_ENGINE_ERRORS } from '../../src/input-engine.errors.js';
import type { FieldMetadata } from '../../src/input-engine.types.js';

function createMeta(overrides: Partial<FieldMetadata> = {}): FieldMetadata {
  return {
    fieldType: 'Video',
    i18nKey: 'test.video',
    ...overrides,
  } as FieldMetadata;
}

describe('VideoFieldHandler', () => {
  let handler: VideoFieldHandler;

  beforeEach(() => {
    handler = new VideoFieldHandler();
  });

  it('has correct fieldType', () => {
    expect(handler.fieldType).toBe('Video');
  });

  describe('parseResponse', () => {
    it('extracts video info from message', () => {
      const message = {
        video: { file_id: 'vid123', file_size: 10000, duration: 30 },
      };
      const result = handler.parseResponse(message, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual({
        fileId: 'vid123',
        fileSize: 10000,
        duration: 30,
      });
    });

    it('returns err when no video in message', () => {
      const result = handler.parseResponse({}, createMeta());
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED);
    });
  });

  describe('validate', () => {
    it('returns ok for valid video value', () => {
      const value = { fileId: 'vid123', fileSize: 1024, duration: 10 };
      const result = handler.validate(value, undefined, createMeta());
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(value);
    });

    it('returns err when duration exceeds maxDurationSeconds', () => {
      const value = { fileId: 'vid123', fileSize: 1024, duration: 120 };
      const result = handler.validate(value, undefined, createMeta({ maxDurationSeconds: 60 }));
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.MEDIA_DURATION_EXCEEDED);
    });

    it('returns err when file size exceeds maxSizeKB', () => {
      const value = { fileId: 'vid123', fileSize: 6_000_000, duration: 10 };
      const result = handler.validate(value, undefined, createMeta({ maxSizeKB: 5000 }));
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().code).toBe(INPUT_ENGINE_ERRORS.MEDIA_SIZE_EXCEEDED);
    });
  });
});
