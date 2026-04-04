import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { VideoFieldHandler } from '../../src/fields/media/video.field.js';
import { INPUT_ENGINE_ERRORS } from '../../src/input-engine.errors.js';
import type { FieldMetadata } from '../../src/input-engine.types.js';
import type { RenderContext } from '../../src/fields/field.handler.js';
import type { StorageEngineClient, InputEngineLogger } from '../../src/input-engine.contracts.js';

function createMeta(overrides: Partial<FieldMetadata> = {}): FieldMetadata {
  return {
    fieldType: 'Video',
    i18nKey: 'test.video',
    ...overrides,
  } as FieldMetadata;
}

function createMockLogger(): InputEngineLogger {
  return { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };
}

function createMockRenderCtx(overrides: Partial<RenderContext> = {}): RenderContext {
  return {
    conversation: {
      external: vi.fn().mockImplementation((fn: () => Promise<unknown>) => fn()),
    },
    ctx: {
      api: {
        getFile: vi.fn().mockResolvedValue({ file_path: 'videos/file.mp4' }),
        file: { download: vi.fn().mockResolvedValue(Buffer.from('data')) },
      },
    },
    formData: {},
    formId: 'test',
    fieldIndex: 0,
    ...overrides,
  };
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

  describe('postProcess', () => {
    it('uploads to storage and returns enriched result when storageClient provided', async () => {
      const storageClient: StorageEngineClient = {
        upload: vi.fn().mockResolvedValue(ok('https://storage/video.mp4')),
        validate: vi.fn().mockResolvedValue(ok(undefined)),
      };
      const logger = createMockLogger();
      const renderCtx = createMockRenderCtx({ storageClient, logger });
      const value = { fileId: 'vid_123', fileSize: 10000, duration: 30 };

      const result = await handler.postProcess!(value, renderCtx, createMeta());

      expect(result.isOk()).toBe(true);
      const enriched = result._unsafeUnwrap() as Record<string, unknown>;
      expect(enriched['telegramFileId']).toBe('vid_123');
      expect(enriched['storageUrl']).toBe('https://storage/video.mp4');
    });

    it('returns original value unchanged when no storageClient', async () => {
      const renderCtx = createMockRenderCtx({ storageClient: undefined });
      const value = { fileId: 'vid_456', fileSize: 1024, duration: 10 };

      const result = await handler.postProcess!(value, renderCtx, createMeta());

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(value);
    });

    it('degrades gracefully on upload failure', async () => {
      const storageClient: StorageEngineClient = {
        upload: vi.fn().mockResolvedValue(err(new AppError('storage.failed'))),
        validate: vi.fn().mockResolvedValue(ok(undefined)),
      };
      const logger = createMockLogger();
      const renderCtx = createMockRenderCtx({ storageClient, logger });
      const value = { fileId: 'vid_789', fileSize: 5000, duration: 15 };

      const result = await handler.postProcess!(value, renderCtx, createMeta());

      expect(result.isOk()).toBe(true);
      const degraded = result._unsafeUnwrap() as Record<string, unknown>;
      expect(degraded['telegramFileId']).toBe('vid_789');
      expect(degraded['storageUrl']).toBeUndefined();
      expect(logger.warn).toHaveBeenCalled();
    });
  });
});
