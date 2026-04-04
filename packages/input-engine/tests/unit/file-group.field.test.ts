import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { FileGroupFieldHandler } from '../../src/fields/media/file-group.field.js';
import { INPUT_ENGINE_ERRORS } from '../../src/input-engine.errors.js';
import type { FieldMetadata } from '../../src/input-engine.types.js';
import type { RenderContext } from '../../src/fields/field.handler.js';
import type { StorageEngineClient, InputEngineLogger } from '../../src/input-engine.contracts.js';

function createMeta(overrides: Partial<FieldMetadata> = {}): FieldMetadata {
  return {
    fieldType: 'FileGroup',
    i18nKey: 'test.fileGroup',
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
        getFile: vi.fn().mockResolvedValue({ file_path: 'docs/file.pdf' }),
        file: { download: vi.fn().mockResolvedValue(Buffer.from('data')) },
      },
    },
    formData: {},
    formId: 'test',
    fieldIndex: 0,
    ...overrides,
  };
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

  describe('postProcess', () => {
    it('uploads each file in the array and returns array of StorageUploadResults', async () => {
      const storageClient: StorageEngineClient = {
        upload: vi.fn().mockResolvedValue(ok('https://storage/uploaded')),
        validate: vi.fn().mockResolvedValue(ok(undefined)),
      };
      const logger = createMockLogger();
      const renderCtx = createMockRenderCtx({ storageClient, logger });
      const files = [
        { fileId: 'fg_1', fileName: 'file1.pdf', fileSize: 1024, mimeType: 'application/pdf' },
        { fileId: 'fg_2', fileName: 'file2.doc', fileSize: 2048, mimeType: 'application/msword' },
        { fileId: 'fg_3', fileName: 'file3.txt', fileSize: 512, mimeType: 'text/plain' },
      ];

      const result = await handler.postProcess!(files, renderCtx, createMeta());

      expect(result.isOk()).toBe(true);
      const results = result._unsafeUnwrap() as Array<Record<string, unknown>>;
      expect(results).toHaveLength(3);
      expect(results[0]['telegramFileId']).toBe('fg_1');
      expect(results[0]['storageUrl']).toBe('https://storage/uploaded');
      expect(results[1]['telegramFileId']).toBe('fg_2');
      expect(results[2]['telegramFileId']).toBe('fg_3');
      // upload was called for each file
      expect(storageClient.upload).toHaveBeenCalledTimes(3);
    });

    it('returns original array unchanged when no storageClient', async () => {
      const renderCtx = createMockRenderCtx({ storageClient: undefined });
      const files = [
        { fileId: 'fg_456', fileName: 'doc.pdf' },
        { fileId: 'fg_789', fileName: 'doc2.pdf' },
      ];

      const result = await handler.postProcess!(files, renderCtx, createMeta());

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(files);
    });

    it('returns err immediately when any file upload fails with non-degraded error', async () => {
      const storageClient: StorageEngineClient = {
        upload: vi.fn().mockResolvedValue(ok('https://storage/uploaded')),
        validate: vi.fn().mockResolvedValue(ok(undefined)),
      };
      const logger = createMockLogger();
      const getFileMock = vi
        .fn()
        .mockResolvedValueOnce({ file_path: 'docs/file1.pdf' })
        .mockResolvedValueOnce({ file_path: 'docs/file2.pdf' });
      const renderCtx = createMockRenderCtx({
        storageClient,
        logger,
        ctx: {
          api: {
            getFile: getFileMock,
            file: { download: vi.fn().mockResolvedValue(Buffer.from('data')) },
          },
        },
      });
      const files = [
        { fileId: 'fg_ok', fileName: 'ok.pdf', fileSize: 1024, mimeType: 'application/pdf' },
        { fileId: 'fg_fail', fileName: 'fail.doc', fileSize: 2048, mimeType: 'application/msword' },
      ];

      const result = await handler.postProcess!(files, renderCtx, createMeta());

      // uploadToStorage degrades gracefully (returns ok with fallback), so both should succeed
      expect(result.isOk()).toBe(true);
      const results = result._unsafeUnwrap() as Array<Record<string, unknown>>;
      expect(results).toHaveLength(2);
    });

    it('degrades gracefully per-file on upload failure', async () => {
      const storageClient: StorageEngineClient = {
        upload: vi.fn().mockResolvedValue(err(new AppError('storage.failed'))),
        validate: vi.fn().mockResolvedValue(ok(undefined)),
      };
      const logger = createMockLogger();
      const renderCtx = createMockRenderCtx({ storageClient, logger });
      const files = [{ fileId: 'fg_789', fileName: 'file.doc', mimeType: 'application/msword' }];

      const result = await handler.postProcess!(files, renderCtx, createMeta());

      expect(result.isOk()).toBe(true);
      const results = result._unsafeUnwrap() as Array<Record<string, unknown>>;
      expect(results).toHaveLength(1);
      expect(results[0]['telegramFileId']).toBe('fg_789');
      expect(results[0]['storageUrl']).toBeUndefined();
      expect(logger.warn).toHaveBeenCalled();
    });
  });
});
