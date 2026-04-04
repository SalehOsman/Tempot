import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { AudioFieldHandler } from '../../src/fields/media/audio.field.js';
import { INPUT_ENGINE_ERRORS } from '../../src/input-engine.errors.js';
import type { FieldMetadata } from '../../src/input-engine.types.js';
import type { RenderContext } from '../../src/fields/field.handler.js';
import type { StorageEngineClient, InputEngineLogger } from '../../src/input-engine.contracts.js';

function createMeta(overrides: Partial<FieldMetadata> = {}): FieldMetadata {
  return {
    fieldType: 'Audio',
    i18nKey: 'test.audio',
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
        getFile: vi.fn().mockResolvedValue({ file_path: 'audio/file.mp3' }),
        file: { download: vi.fn().mockResolvedValue(Buffer.from('data')) },
      },
    },
    formData: {},
    formId: 'test',
    fieldIndex: 0,
    ...overrides,
  };
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

    it('preserves mime_type from Telegram audio through parse', () => {
      const message = {
        audio: { file_id: 'aud456', file_size: 4000, duration: 90, mime_type: 'audio/ogg' },
      };
      const result = handler.parseResponse(message, createMeta());
      expect(result.isOk()).toBe(true);
      const parsed = result._unsafeUnwrap() as Record<string, unknown>;
      expect(parsed['mimeType']).toBe('audio/ogg');
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

  describe('postProcess', () => {
    it('uploads to storage and returns enriched result when storageClient provided', async () => {
      const storageClient: StorageEngineClient = {
        upload: vi.fn().mockResolvedValue(ok('https://storage/audio.mp3')),
        validate: vi.fn().mockResolvedValue(ok(undefined)),
      };
      const logger = createMockLogger();
      const renderCtx = createMockRenderCtx({ storageClient, logger });
      const value = { fileId: 'aud_123', fileSize: 8000, duration: 180 };

      const result = await handler.postProcess!(value, renderCtx, createMeta());

      expect(result.isOk()).toBe(true);
      const enriched = result._unsafeUnwrap() as Record<string, unknown>;
      expect(enriched['telegramFileId']).toBe('aud_123');
      expect(enriched['storageUrl']).toBe('https://storage/audio.mp3');
    });

    it('returns original value unchanged when no storageClient', async () => {
      const renderCtx = createMockRenderCtx({ storageClient: undefined });
      const value = { fileId: 'aud_456', fileSize: 1024, duration: 60 };

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
      const value = { fileId: 'aud_789', fileSize: 5000, duration: 90 };

      const result = await handler.postProcess!(value, renderCtx, createMeta());

      expect(result.isOk()).toBe(true);
      const degraded = result._unsafeUnwrap() as Record<string, unknown>;
      expect(degraded['telegramFileId']).toBe('aud_789');
      expect(degraded['storageUrl']).toBeUndefined();
      expect(logger.warn).toHaveBeenCalled();
    });

    it('uses actual mime type from parsed audio instead of hardcoded value', async () => {
      const storageClient: StorageEngineClient = {
        upload: vi.fn().mockResolvedValue(ok('https://storage/audio.ogg')),
        validate: vi.fn().mockResolvedValue(ok(undefined)),
      };
      const logger = createMockLogger();
      const renderCtx = createMockRenderCtx({ storageClient, logger });
      const value = { fileId: 'aud_ogg', fileSize: 3000, duration: 45, mimeType: 'audio/ogg' };

      const result = await handler.postProcess!(value, renderCtx, createMeta());

      expect(result.isOk()).toBe(true);
      const enriched = result._unsafeUnwrap() as Record<string, unknown>;
      expect(enriched['mimeType']).toBe('audio/ogg');
      expect(storageClient.upload).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ mimeType: 'audio/ogg' }),
      );
    });
  });
});
