import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { PhotoFieldHandler } from '../../src/fields/media/photo.field.js';
import { INPUT_ENGINE_ERRORS } from '../../src/input-engine.errors.js';
import type { FieldMetadata } from '../../src/input-engine.types.js';
import type { RenderContext } from '../../src/fields/field.handler.js';
import type { StorageEngineClient, InputEngineLogger } from '../../src/input-engine.contracts.js';

function createMeta(overrides: Partial<FieldMetadata> = {}): FieldMetadata {
  return {
    fieldType: 'Photo',
    i18nKey: 'test.photo',
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
        getFile: vi.fn().mockResolvedValue({ file_path: 'photos/file.jpg' }),
        file: { download: vi.fn().mockResolvedValue(Buffer.from('data')) },
      },
    },
    formData: {},
    formId: 'test',
    fieldIndex: 0,
    ...overrides,
  };
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

  describe('postProcess', () => {
    it('uploads to storage and returns enriched result when storageClient provided', async () => {
      const storageClient: StorageEngineClient = {
        upload: vi.fn().mockResolvedValue(ok('https://storage/photo.jpg')),
        validate: vi.fn().mockResolvedValue(ok(undefined)),
      };
      const logger = createMockLogger();
      const renderCtx = createMockRenderCtx({ storageClient, logger });
      const value = { fileId: 'photo_123', fileSize: 2048 };

      const result = await handler.postProcess!(value, renderCtx, createMeta());

      expect(result.isOk()).toBe(true);
      const enriched = result._unsafeUnwrap() as Record<string, unknown>;
      expect(enriched['telegramFileId']).toBe('photo_123');
      expect(enriched['storageUrl']).toBe('https://storage/photo.jpg');
    });

    it('returns original value unchanged when no storageClient', async () => {
      const renderCtx = createMockRenderCtx({ storageClient: undefined });
      const value = { fileId: 'photo_456', fileSize: 1024 };

      const result = await handler.postProcess!(value, renderCtx, createMeta());

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(value);
    });

    it('degrades gracefully on upload failure, returns original value', async () => {
      const storageClient: StorageEngineClient = {
        upload: vi.fn().mockResolvedValue(err(new AppError('storage.failed'))),
        validate: vi.fn().mockResolvedValue(ok(undefined)),
      };
      const logger = createMockLogger();
      const renderCtx = createMockRenderCtx({ storageClient, logger });
      const value = { fileId: 'photo_789', fileSize: 4096 };

      const result = await handler.postProcess!(value, renderCtx, createMeta());

      expect(result.isOk()).toBe(true);
      const degraded = result._unsafeUnwrap() as Record<string, unknown>;
      expect(degraded['telegramFileId']).toBe('photo_789');
      expect(degraded['storageUrl']).toBeUndefined();
      expect(logger.warn).toHaveBeenCalled();
    });
  });
});
