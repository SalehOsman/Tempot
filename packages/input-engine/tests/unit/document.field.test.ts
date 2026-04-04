import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { DocumentFieldHandler } from '../../src/fields/media/document.field.js';
import { INPUT_ENGINE_ERRORS } from '../../src/input-engine.errors.js';
import type { FieldMetadata } from '../../src/input-engine.types.js';
import type { RenderContext } from '../../src/fields/field.handler.js';
import type { StorageEngineClient, InputEngineLogger } from '../../src/input-engine.contracts.js';

function createMeta(overrides: Partial<FieldMetadata> = {}): FieldMetadata {
  return {
    fieldType: 'Document',
    i18nKey: 'test.document',
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

  describe('postProcess', () => {
    it('uploads to storage and returns enriched result when storageClient provided', async () => {
      const storageClient: StorageEngineClient = {
        upload: vi.fn().mockResolvedValue(ok('https://storage/report.pdf')),
        validate: vi.fn().mockResolvedValue(ok(undefined)),
      };
      const logger = createMockLogger();
      const renderCtx = createMockRenderCtx({ storageClient, logger });
      const value = {
        fileId: 'doc_123',
        fileName: 'report.pdf',
        fileSize: 2048,
        mimeType: 'application/pdf',
      };

      const result = await handler.postProcess!(value, renderCtx, createMeta());

      expect(result.isOk()).toBe(true);
      const enriched = result._unsafeUnwrap() as Record<string, unknown>;
      expect(enriched['telegramFileId']).toBe('doc_123');
      expect(enriched['storageUrl']).toBe('https://storage/report.pdf');
      expect(enriched['fileName']).toBe('report.pdf');
      expect(enriched['mimeType']).toBe('application/pdf');
    });

    it('returns original value unchanged when no storageClient', async () => {
      const renderCtx = createMockRenderCtx({ storageClient: undefined });
      const value = { fileId: 'doc_456', fileName: 'file.docx' };

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
      const value = { fileId: 'doc_789', fileName: 'file.pdf', mimeType: 'application/pdf' };

      const result = await handler.postProcess!(value, renderCtx, createMeta());

      expect(result.isOk()).toBe(true);
      const degraded = result._unsafeUnwrap() as Record<string, unknown>;
      expect(degraded['telegramFileId']).toBe('doc_789');
      expect(degraded['storageUrl']).toBeUndefined();
      expect(logger.warn).toHaveBeenCalled();
    });
  });
});
