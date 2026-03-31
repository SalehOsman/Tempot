import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Readable } from 'node:stream';
import { DriveProvider } from '../../src/providers/drive.provider.js';
import { STORAGE_ERRORS } from '../../src/storage.errors.js';
import type { drive_v3 } from '@googleapis/drive';

/** Create a mock Google Drive client */
function createMockDriveClient(): drive_v3.Drive {
  return {
    files: {
      create: vi.fn(),
      get: vi.fn(),
      delete: vi.fn(),
    },
  } as unknown as drive_v3.Drive;
}

describe('DriveProvider', () => {
  const config = { folderId: 'root-folder-id' };
  let mockDrive: drive_v3.Drive;
  let provider: DriveProvider;

  beforeEach(() => {
    mockDrive = createMockDriveClient();
    provider = new DriveProvider(mockDrive, config);
  });

  describe('upload', () => {
    it('should upload and return file ID and webViewLink', async () => {
      vi.mocked(mockDrive.files.create).mockResolvedValue({
        data: {
          id: 'drive-file-id',
          webViewLink: 'https://drive.google.com/file/xxx',
        },
      });
      const result = await provider.upload('key.txt', Buffer.from('data'), 'text/plain');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.providerKey).toBe('drive-file-id');
        expect(result.value.url).toBe('https://drive.google.com/file/xxx');
      }
    });

    it('should return error when no file ID returned', async () => {
      vi.mocked(mockDrive.files.create).mockResolvedValue({
        data: { id: null },
      });
      const result = await provider.upload('key.txt', Buffer.from('data'), 'text/plain');
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(STORAGE_ERRORS.UPLOAD_FAILED);
      }
    });

    it('should return UPLOAD_FAILED on Drive API error', async () => {
      vi.mocked(mockDrive.files.create).mockRejectedValue(new Error('Drive API error'));
      const result = await provider.upload('key.txt', Buffer.from('data'), 'text/plain');
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(STORAGE_ERRORS.UPLOAD_FAILED);
      }
    });

    it('should handle stream uploads', async () => {
      vi.mocked(mockDrive.files.create).mockResolvedValue({
        data: { id: 'stream-file-id' },
      });
      const stream = Readable.from(Buffer.from('stream data'));
      const result = await provider.upload('stream.txt', stream, 'text/plain');
      expect(result.isOk()).toBe(true);
    });
  });

  describe('download', () => {
    it('should return a Readable stream', async () => {
      const mockStream = Readable.from(Buffer.from('drive content'));
      vi.mocked(mockDrive.files.get).mockResolvedValue({
        data: mockStream,
      });
      const result = await provider.download('drive-file-id');
      expect(result.isOk()).toBe(true);
    });

    it('should return DOWNLOAD_FAILED on error', async () => {
      vi.mocked(mockDrive.files.get).mockRejectedValue(new Error('Access denied'));
      const result = await provider.download('drive-file-id');
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(STORAGE_ERRORS.DOWNLOAD_FAILED);
      }
    });
  });

  describe('delete', () => {
    it('should delete a file by ID', async () => {
      vi.mocked(mockDrive.files.delete).mockResolvedValue({});
      const result = await provider.delete('drive-file-id');
      expect(result.isOk()).toBe(true);
    });

    it('should return DELETE_FAILED on error', async () => {
      vi.mocked(mockDrive.files.delete).mockRejectedValue(new Error('Delete failed'));
      const result = await provider.delete('drive-file-id');
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(STORAGE_ERRORS.DELETE_FAILED);
      }
    });
  });

  describe('getSignedUrl', () => {
    it('should return webViewLink (expiresInSeconds is ignored)', async () => {
      vi.mocked(mockDrive.files.get).mockResolvedValue({
        data: { webViewLink: 'https://drive.google.com/file/xxx' },
      });
      const result = await provider.getSignedUrl('drive-file-id', 3600);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe('https://drive.google.com/file/xxx');
      }
    });

    it('should return error when no webViewLink available', async () => {
      vi.mocked(mockDrive.files.get).mockResolvedValue({
        data: { webViewLink: null },
      });
      const result = await provider.getSignedUrl('drive-file-id', 3600);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(STORAGE_ERRORS.SIGNED_URL_FAILED);
      }
    });
  });

  describe('exists', () => {
    it('should return true when file exists', async () => {
      vi.mocked(mockDrive.files.get).mockResolvedValue({
        data: { id: 'drive-file-id' },
      });
      const result = await provider.exists('drive-file-id');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) expect(result.value).toBe(true);
    });

    it('should return false on error (not an AppError)', async () => {
      vi.mocked(mockDrive.files.get).mockRejectedValue(new Error('Not found'));
      const result = await provider.exists('missing-id');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) expect(result.value).toBe(false);
    });
  });
});
