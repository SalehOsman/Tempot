import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Readable } from 'node:stream';
import { STORAGE_ERRORS } from '../../src/errors.js';

// Use vi.hoisted to ensure mocks are available before vi.mock hoisting
const { mockSend, mockUploadDone, mockGetSignedUrl, uploadConstructorArgs } = vi.hoisted(() => ({
  mockSend: vi.fn(),
  mockUploadDone: vi.fn().mockResolvedValue({}),
  mockGetSignedUrl: vi.fn().mockResolvedValue('https://signed-url.example.com/key.txt'),
  uploadConstructorArgs: [] as unknown[],
}));

vi.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: class MockS3Client {
      send(...args: unknown[]) {
        return mockSend(...args);
      }
    },
    GetObjectCommand: class MockGetObjectCommand {
      constructor(public readonly input: unknown) {}
    },
    DeleteObjectCommand: class MockDeleteObjectCommand {
      constructor(public readonly input: unknown) {}
    },
    HeadObjectCommand: class MockHeadObjectCommand {
      constructor(public readonly input: unknown) {}
    },
  };
});

vi.mock('@aws-sdk/lib-storage', () => ({
  Upload: class MockUpload {
    constructor(args: unknown) {
      uploadConstructorArgs.push(args);
    }
    done = mockUploadDone;
  },
}));

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: (...args: unknown[]) => mockGetSignedUrl(...args),
}));

// Dynamic import after mocks
const { S3Provider } = await import('../../src/providers/s3.provider.js');

describe('S3Provider', () => {
  const config = { bucket: 'test-bucket', region: 'us-east-1' };
  let provider: InstanceType<typeof S3Provider>;

  beforeEach(() => {
    vi.clearAllMocks();
    uploadConstructorArgs.length = 0;
    mockSend.mockResolvedValue({});
    mockUploadDone.mockResolvedValue({});
    mockGetSignedUrl.mockResolvedValue('https://signed-url.example.com/key.txt');
    provider = new S3Provider(config);
  });

  describe('upload', () => {
    it('should upload a Buffer and return providerKey', async () => {
      const result = await provider.upload('key.txt', Buffer.from('data'), 'text/plain');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.providerKey).toBe('key.txt');
      }
    });

    it('should use SSE-S3 (AES256) encryption by default', async () => {
      await provider.upload('key.txt', Buffer.from('data'), 'text/plain');
      expect(uploadConstructorArgs).toHaveLength(1);
      const args = uploadConstructorArgs[0] as Record<string, unknown>;
      const params = args.params as Record<string, unknown>;
      expect(params.ServerSideEncryption).toBe('AES256');
      expect(params.Bucket).toBe('test-bucket');
      expect(params.Key).toBe('key.txt');
    });

    it('should use SSE-KMS encryption when configured', async () => {
      const kmsProvider = new S3Provider({
        ...config,
        encryptionMode: 'SSE-KMS',
        kmsKeyId: 'arn:aws:kms:us-east-1:123:key/abc',
      });
      await kmsProvider.upload('key.txt', Buffer.from('data'), 'text/plain');
      expect(uploadConstructorArgs).toHaveLength(1);
      const args = uploadConstructorArgs[0] as Record<string, unknown>;
      const params = args.params as Record<string, unknown>;
      expect(params.ServerSideEncryption).toBe('aws:kms');
      expect(params.SSEKMSKeyId).toBe('arn:aws:kms:us-east-1:123:key/abc');
    });

    it('should handle stream uploads', async () => {
      const stream = Readable.from(Buffer.from('stream data'));
      const result = await provider.upload('stream.txt', stream, 'text/plain');
      expect(result.isOk()).toBe(true);
    });

    it('should return UPLOAD_FAILED on error', async () => {
      mockUploadDone.mockRejectedValue(new Error('S3 network error'));
      const result = await provider.upload('key.txt', Buffer.from('data'), 'text/plain');
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(STORAGE_ERRORS.UPLOAD_FAILED);
      }
    });
  });

  describe('download', () => {
    it('should return a Readable stream for existing key', async () => {
      const mockStream = Readable.from(Buffer.from('s3 content'));
      mockSend.mockResolvedValue({ Body: mockStream });

      const result = await provider.download('key.txt');
      expect(result.isOk()).toBe(true);
    });

    it('should return NOT_FOUND when response Body is null', async () => {
      mockSend.mockResolvedValue({ Body: null });

      const result = await provider.download('key.txt');
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(STORAGE_ERRORS.NOT_FOUND);
      }
    });

    it('should return DOWNLOAD_FAILED on SDK error', async () => {
      mockSend.mockRejectedValue(new Error('Access Denied'));

      const result = await provider.download('key.txt');
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(STORAGE_ERRORS.DOWNLOAD_FAILED);
      }
    });
  });

  describe('delete', () => {
    it('should delete a key successfully', async () => {
      mockSend.mockResolvedValue({});
      const result = await provider.delete('key.txt');
      expect(result.isOk()).toBe(true);
    });

    it('should return DELETE_FAILED on error', async () => {
      mockSend.mockRejectedValue(new Error('Delete error'));
      const result = await provider.delete('key.txt');
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(STORAGE_ERRORS.DELETE_FAILED);
      }
    });
  });

  describe('exists', () => {
    it('should return true when HeadObject succeeds', async () => {
      mockSend.mockResolvedValue({});
      const result = await provider.exists('key.txt');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) expect(result.value).toBe(true);
    });

    it('should return ok(false) on error, not err()', async () => {
      mockSend.mockRejectedValue(new Error('Not Found'));
      const result = await provider.exists('missing-key');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) expect(result.value).toBe(false);
    });
  });

  describe('getSignedUrl', () => {
    it('should return a pre-signed URL', async () => {
      const result = await provider.getSignedUrl('key.txt', 3600);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toContain('https://');
      }
    });

    it('should return SIGNED_URL_FAILED on error', async () => {
      mockGetSignedUrl.mockRejectedValue(new Error('Signing error'));
      const result = await provider.getSignedUrl('key.txt', 3600);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(STORAGE_ERRORS.SIGNED_URL_FAILED);
      }
    });
  });
});
