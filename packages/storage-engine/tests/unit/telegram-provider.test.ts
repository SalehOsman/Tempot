import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Readable } from 'node:stream';
import type { Api } from 'grammy';
import { STORAGE_ERRORS } from '../../src/errors.js';
import { TelegramProvider } from '../../src/providers/telegram.provider.js';
import type { TelegramProviderConfig } from '../../src/types.js';

type SendDocumentResult = ReturnType<Api['sendDocument']> extends Promise<infer R> ? R : never;

function createMockApi(): Api {
  return {
    token: 'test-bot-token',
    sendDocument: vi.fn(),
    getFile: vi.fn(),
  } as unknown as Api;
}

function mockSendDocResult(fileId: string, uniqueId = 'u', size = 10): SendDocumentResult {
  return { document: { file_id: fileId, file_unique_id: uniqueId, file_size: size } } as SendDocumentResult;
}

function mockGetFileResult(filePath?: string) {
  return { file_id: 'tg-file-id', file_unique_id: 'unique', ...(filePath ? { file_path: filePath } : {}) };
}

describe('TelegramProvider', () => {
  const config: TelegramProviderConfig = { storageChatId: -1001234567890 };
  let mockApi: Api;
  let provider: TelegramProvider;

  beforeEach(() => {
    mockApi = createMockApi();
    provider = new TelegramProvider(mockApi, config);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should return telegram as type', () => {
    expect(provider.type).toBe('telegram');
  });

  describe('upload', () => {
    it('should upload Buffer and return file_id as providerKey', async () => {
      vi.mocked(mockApi.sendDocument).mockResolvedValue(mockSendDocResult('tg-file-id-123', 'unique-123', 100));
      const result = await provider.upload('docs/invoice.pdf', Buffer.from('pdf-data'), 'application/pdf');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) expect(result.value.providerKey).toBe('tg-file-id-123');
    });

    it('should upload Readable stream and return file_id', async () => {
      vi.mocked(mockApi.sendDocument).mockResolvedValue(mockSendDocResult('tg-stream-id', 'unique-s', 50));
      const stream = Readable.from(Buffer.from('stream-data'));
      const result = await provider.upload('stream.txt', stream, 'text/plain');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) expect(result.value.providerKey).toBe('tg-stream-id');
    });

    it('should pass key as caption in sendDocument', async () => {
      vi.mocked(mockApi.sendDocument).mockResolvedValue(mockSendDocResult('file-id'));
      await provider.upload('my/key.pdf', Buffer.from('data'), 'application/pdf');
      expect(mockApi.sendDocument).toHaveBeenCalledWith(
        config.storageChatId,
        expect.anything(),
        { caption: 'my/key.pdf' },
      );
    });

    it('should return UPLOAD_FAILED on API error', async () => {
      vi.mocked(mockApi.sendDocument).mockRejectedValue(new Error('Telegram API error'));
      const result = await provider.upload('key.txt', Buffer.from('data'), 'text/plain');
      expect(result.isErr()).toBe(true);
      if (result.isErr()) expect(result.error.code).toBe(STORAGE_ERRORS.UPLOAD_FAILED);
    });

    it('should return UPLOAD_FAILED when response has no document', async () => {
      vi.mocked(mockApi.sendDocument).mockResolvedValue({} as SendDocumentResult);
      const result = await provider.upload('key.txt', Buffer.from('data'), 'text/plain');
      expect(result.isErr()).toBe(true);
      if (result.isErr()) expect(result.error.code).toBe(STORAGE_ERRORS.UPLOAD_FAILED);
    });
  });

  describe('download', () => {
    it('should return Readable stream on success', async () => {
      vi.mocked(mockApi.getFile).mockResolvedValue(mockGetFileResult('documents/file_0.pdf'));
      const mockBody = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('file-content'));
          controller.close();
        },
      });
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, body: mockBody }));
      const result = await provider.download('tg-file-id');
      expect(result.isOk()).toBe(true);
    });

    it('should return DOWNLOAD_FAILED when no file_path in response', async () => {
      vi.mocked(mockApi.getFile).mockResolvedValue(mockGetFileResult());
      const result = await provider.download('tg-file-id');
      expect(result.isErr()).toBe(true);
      if (result.isErr()) expect(result.error.code).toBe(STORAGE_ERRORS.DOWNLOAD_FAILED);
    });

    it('should return DOWNLOAD_FAILED on API error', async () => {
      vi.mocked(mockApi.getFile).mockRejectedValue(new Error('Invalid file_id'));
      const result = await provider.download('bad-id');
      expect(result.isErr()).toBe(true);
      if (result.isErr()) expect(result.error.code).toBe(STORAGE_ERRORS.DOWNLOAD_FAILED);
    });
  });

  describe('delete', () => {
    it('should always return ok (no-op)', async () => {
      const result = await provider.delete('any-file-id');
      expect(result.isOk()).toBe(true);
    });
  });

  describe('getSignedUrl', () => {
    it('should return download URL containing token and file_path', async () => {
      vi.mocked(mockApi.getFile).mockResolvedValue(mockGetFileResult('documents/file_0.pdf'));
      const result = await provider.getSignedUrl('tg-file-id', 3600);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(
          'https://api.telegram.org/file/bottest-bot-token/documents/file_0.pdf',
        );
      }
    });

    it('should ignore expiresInSeconds parameter', async () => {
      vi.mocked(mockApi.getFile).mockResolvedValue(mockGetFileResult('documents/file_0.pdf'));
      const result1 = await provider.getSignedUrl('tg-file-id', 60);
      const result2 = await provider.getSignedUrl('tg-file-id', 86400);
      expect(result1.isOk()).toBe(true);
      expect(result2.isOk()).toBe(true);
      if (result1.isOk() && result2.isOk()) expect(result1.value).toBe(result2.value);
    });

    it('should return SIGNED_URL_FAILED when no file_path', async () => {
      vi.mocked(mockApi.getFile).mockResolvedValue(mockGetFileResult());
      const result = await provider.getSignedUrl('tg-file-id', 3600);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) expect(result.error.code).toBe(STORAGE_ERRORS.SIGNED_URL_FAILED);
    });

    it('should return SIGNED_URL_FAILED on API error', async () => {
      vi.mocked(mockApi.getFile).mockRejectedValue(new Error('API error'));
      const result = await provider.getSignedUrl('bad-id', 3600);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) expect(result.error.code).toBe(STORAGE_ERRORS.SIGNED_URL_FAILED);
    });
  });

  describe('exists', () => {
    it('should return true for valid file_id', async () => {
      vi.mocked(mockApi.getFile).mockResolvedValue(mockGetFileResult('documents/file_0.pdf'));
      const result = await provider.exists('tg-file-id');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) expect(result.value).toBe(true);
    });

    it('should return false for invalid file_id', async () => {
      vi.mocked(mockApi.getFile).mockRejectedValue(new Error('Bad Request: invalid file_id'));
      const result = await provider.exists('bad-id');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) expect(result.value).toBe(false);
    });
  });
});
