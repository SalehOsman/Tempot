import { describe, it, expect, vi } from 'vitest';
import { ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { uploadToStorage } from '../../src/fields/media/storage-upload.helper.js';
import type { StorageUploadResult } from '../../src/index.js';
import type { StorageEngineClient, InputEngineLogger } from '../../src/input-engine.contracts.js';

function createMockLogger(): InputEngineLogger {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };
}

function createMockStorageClient(
  uploadResult: Awaited<ReturnType<StorageEngineClient['upload']>> = ok('https://storage/file.jpg'),
): StorageEngineClient {
  return {
    upload: vi.fn().mockResolvedValue(uploadResult),
    validate: vi.fn().mockResolvedValue(ok(undefined)),
  };
}

interface MockConversation {
  external: (fn: () => Promise<unknown>) => Promise<unknown>;
}

function createMockConversation(): MockConversation {
  return {
    external: vi.fn().mockImplementation((fn: () => Promise<unknown>) => fn()),
  };
}

interface MockCtxApi {
  getFile: (fileId: string) => Promise<{ file_path?: string }>;
  file: {
    download: (filePath: string) => Promise<Buffer>;
  };
}

interface MockCtx {
  api: MockCtxApi;
}

function createMockCtx(filePath?: string): MockCtx {
  return {
    api: {
      getFile: vi.fn().mockResolvedValue({ file_path: filePath }),
      file: {
        download: vi.fn().mockResolvedValue(Buffer.from('fake-file-data')),
      },
    },
  };
}

describe('StorageUploadResult barrel export', () => {
  it('is importable from the barrel as a type', () => {
    // Type-level check: if StorageUploadResult is not exported, this file won't compile
    const result: StorageUploadResult = {
      telegramFileId: 'test-id',
      storageUrl: 'https://example.com/file.jpg',
      fileName: 'file.jpg',
      mimeType: 'image/jpeg',
      size: 1024,
    };
    expect(result.telegramFileId).toBe('test-id');
  });
});

describe('uploadToStorage', () => {
  it('downloads from Telegram and uploads to storage on success', async () => {
    const storageClient = createMockStorageClient(ok('https://storage/photo.jpg'));
    const logger = createMockLogger();
    const conversation = createMockConversation();
    const ctx = createMockCtx('photos/file_123.jpg');

    const result = await uploadToStorage({
      fileId: 'tg_file_id_123',
      fileName: 'photo.jpg',
      mimeType: 'image/jpeg',
      fileSize: 1024,
      conversation,
      ctx,
      storageClient,
      logger,
    });

    expect(result.isOk()).toBe(true);
    const value = result._unsafeUnwrap();
    expect(value).toEqual({
      telegramFileId: 'tg_file_id_123',
      storageUrl: 'https://storage/photo.jpg',
      fileName: 'photo.jpg',
      mimeType: 'image/jpeg',
      size: 1024,
    });
  });

  it('returns telegramFileId only when getFile has no file_path', async () => {
    const storageClient = createMockStorageClient();
    const logger = createMockLogger();
    const conversation = createMockConversation();
    const ctx = createMockCtx(undefined); // no file_path

    const result = await uploadToStorage({
      fileId: 'tg_file_id_456',
      fileName: 'doc.pdf',
      mimeType: 'application/pdf',
      conversation,
      ctx,
      storageClient,
      logger,
    });

    expect(result.isOk()).toBe(true);
    const value = result._unsafeUnwrap();
    expect(value).toEqual({ telegramFileId: 'tg_file_id_456' });
    expect(logger.warn).toHaveBeenCalled();
  });

  it('returns telegramFileId only when upload fails (graceful degradation)', async () => {
    const uploadErr = new AppError('storage.upload_failed', { reason: 'disk full' });
    const storageClient = createMockStorageClient(err(uploadErr));
    const logger = createMockLogger();
    const conversation = createMockConversation();
    const ctx = createMockCtx('videos/file_789.mp4');

    const result = await uploadToStorage({
      fileId: 'tg_file_id_789',
      fileName: 'video.mp4',
      mimeType: 'video/mp4',
      fileSize: 5000,
      conversation,
      ctx,
      storageClient,
      logger,
    });

    expect(result.isOk()).toBe(true);
    const value = result._unsafeUnwrap();
    expect(value).toEqual({ telegramFileId: 'tg_file_id_789' });
    expect(logger.warn).toHaveBeenCalled();
  });

  it('returns telegramFileId only when download throws (graceful degradation)', async () => {
    const storageClient = createMockStorageClient();
    const logger = createMockLogger();
    const conversation: MockConversation = {
      external: vi.fn().mockRejectedValueOnce(new Error('Network error')),
    };
    const ctx = createMockCtx('photos/file.jpg');

    const result = await uploadToStorage({
      fileId: 'tg_file_id_err',
      fileName: 'broken.jpg',
      mimeType: 'image/jpeg',
      conversation,
      ctx,
      storageClient,
      logger,
    });

    expect(result.isOk()).toBe(true);
    const value = result._unsafeUnwrap();
    expect(value).toEqual({ telegramFileId: 'tg_file_id_err' });
    expect(logger.warn).toHaveBeenCalled();
  });

  it('uses conversation.external for Telegram API calls', async () => {
    const storageClient = createMockStorageClient(ok('https://storage/file.jpg'));
    const logger = createMockLogger();
    const conversation = createMockConversation();
    const ctx = createMockCtx('photos/file.jpg');

    await uploadToStorage({
      fileId: 'tg_file_id_ext',
      fileName: 'photo.jpg',
      mimeType: 'image/jpeg',
      conversation,
      ctx,
      storageClient,
      logger,
    });

    expect(conversation.external).toHaveBeenCalled();
  });
});
