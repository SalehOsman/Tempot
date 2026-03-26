import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { StorageService } from '../../src/storage.service.js';
import { STORAGE_ERRORS } from '../../src/errors.js';
import type { StorageServiceDeps } from '../../src/storage.service.js';
import type { StorageProvider } from '../../src/contracts.js';
import type { Attachment, UploadOptions } from '../../src/types.js';
import { DEFAULT_STORAGE_CONFIG } from '../../src/types.js';

// --- Mock factories ---

function createMockProvider(type: 'local' | 's3' | 'drive' = 'local'): StorageProvider {
  return {
    type,
    upload: vi.fn().mockResolvedValue(ok({ providerKey: 'general/2026-03/uuid.pdf' })),
    download: vi.fn().mockResolvedValue(ok(null)), // simplified
    delete: vi.fn().mockResolvedValue(ok(undefined)),
    getSignedUrl: vi.fn().mockResolvedValue(ok('https://signed.url')),
    exists: vi.fn().mockResolvedValue(ok(true)),
  };
}

function createMockAttachmentRepo() {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    delete: vi.fn(),
    findByModuleAndEntity: vi.fn(),
  };
}

function createMockValidation() {
  return {
    validateUpload: vi.fn().mockReturnValue(
      ok({
        sanitizedName: 'test-file.pdf',
        generatedFileName: '01234567-abcd-7000-8000-000000000001.pdf',
      }),
    ),
    validateMimeType: vi.fn().mockResolvedValue(ok(undefined)),
  };
}

function createMockEventBus() {
  return {
    publish: vi.fn().mockResolvedValue(ok(undefined)),
  };
}

function createMockLogger() {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };
}

const mockAttachment: Attachment = {
  id: 'att-123',
  fileName: '01234567-abcd-7000-8000-000000000001.pdf',
  originalName: 'test-file.pdf',
  mimeType: 'application/pdf',
  size: 1024,
  provider: 'local',
  providerKey: 'general/2026-03/uuid.pdf',
  url: null,
  metadata: null,
  moduleId: null,
  entityId: null,
  isEncrypted: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: null,
  updatedBy: null,
  isDeleted: false,
  deletedAt: null,
  deletedBy: null,
};

const validOptions: UploadOptions = {
  originalName: 'test-file.pdf',
  mimeType: 'application/pdf',
  size: 1024,
};

describe('StorageService', () => {
  let service: StorageService;
  let deps: {
    provider: ReturnType<typeof createMockProvider>;
    attachmentRepo: ReturnType<typeof createMockAttachmentRepo>;
    validation: ReturnType<typeof createMockValidation>;
    eventBus: ReturnType<typeof createMockEventBus>;
    logger: ReturnType<typeof createMockLogger>;
    config: typeof DEFAULT_STORAGE_CONFIG;
  };

  beforeEach(() => {
    deps = {
      provider: createMockProvider(),
      attachmentRepo: createMockAttachmentRepo(),
      validation: createMockValidation(),
      eventBus: createMockEventBus(),
      logger: createMockLogger(),
      config: DEFAULT_STORAGE_CONFIG,
    };
    deps.attachmentRepo.create.mockResolvedValue(ok(mockAttachment));
    deps.attachmentRepo.findById.mockResolvedValue(ok(mockAttachment));
    deps.attachmentRepo.delete.mockResolvedValue(ok(undefined));
    deps.attachmentRepo.findByModuleAndEntity.mockResolvedValue(ok([]));

    service = new StorageService(deps as unknown as StorageServiceDeps);
  });

  describe('upload', () => {
    it('should upload successfully and emit event', async () => {
      const result = await service.upload(Buffer.from('data'), validOptions);
      expect(result.isOk()).toBe(true);
      expect(deps.provider.upload).toHaveBeenCalled();
      expect(deps.attachmentRepo.create).toHaveBeenCalled();
      expect(deps.eventBus.publish).toHaveBeenCalledWith(
        'storage.file.uploaded',
        expect.objectContaining({ attachmentId: 'att-123' }),
      );
    });

    it('should return validation error without uploading', async () => {
      deps.validation.validateUpload.mockReturnValue(err(new AppError(STORAGE_ERRORS.EMPTY_FILE)));
      const result = await service.upload(Buffer.from(''), validOptions);
      expect(result.isErr()).toBe(true);
      expect(deps.provider.upload).not.toHaveBeenCalled();
    });

    it('should return MIME mismatch error for Buffer uploads', async () => {
      deps.validation.validateMimeType.mockResolvedValue(
        err(new AppError(STORAGE_ERRORS.MIME_MISMATCH)),
      );
      const result = await service.upload(Buffer.from('fake'), validOptions);
      expect(result.isErr()).toBe(true);
      expect(deps.provider.upload).not.toHaveBeenCalled();
    });

    it('should return provider error on upload failure', async () => {
      deps.provider.upload.mockResolvedValue(err(new AppError(STORAGE_ERRORS.UPLOAD_FAILED)));
      const result = await service.upload(Buffer.from('data'), validOptions);
      expect(result.isErr()).toBe(true);
    });

    it('should rollback provider on DB failure and log', async () => {
      deps.attachmentRepo.create.mockResolvedValue(err(new AppError('storage.create_failed')));
      const result = await service.upload(Buffer.from('data'), validOptions);
      expect(result.isErr()).toBe(true);
      expect(deps.provider.delete).toHaveBeenCalled();
    });

    it('should log ROLLBACK_FAILED when rollback also fails', async () => {
      deps.attachmentRepo.create.mockResolvedValue(err(new AppError('storage.create_failed')));
      deps.provider.delete.mockResolvedValue(err(new AppError(STORAGE_ERRORS.DELETE_FAILED)));
      const result = await service.upload(Buffer.from('data'), validOptions);
      expect(result.isErr()).toBe(true);
      expect(deps.logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          code: STORAGE_ERRORS.ROLLBACK_FAILED,
        }),
      );
    });

    it('should NOT log when rollback succeeds', async () => {
      deps.attachmentRepo.create.mockResolvedValue(err(new AppError('storage.create_failed')));
      deps.provider.delete.mockResolvedValue(ok(undefined));
      await service.upload(Buffer.from('data'), validOptions);
      expect(deps.logger.warn).not.toHaveBeenCalledWith(
        expect.objectContaining({
          code: STORAGE_ERRORS.ROLLBACK_FAILED,
        }),
      );
    });

    it('should log EVENT_PUBLISH_FAILED but still return success', async () => {
      deps.eventBus.publish.mockResolvedValue(err(new AppError('event_bus.publish_failed')));
      const result = await service.upload(Buffer.from('data'), validOptions);
      expect(result.isOk()).toBe(true);
      expect(deps.logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          code: STORAGE_ERRORS.EVENT_PUBLISH_FAILED,
        }),
      );
    });

    it('should set isEncrypted=true for S3 provider', async () => {
      const s3Deps = { ...deps, provider: createMockProvider('s3') };
      s3Deps.attachmentRepo = createMockAttachmentRepo();
      s3Deps.attachmentRepo.create.mockResolvedValue(ok(mockAttachment));
      const s3Service = new StorageService(s3Deps as unknown as StorageServiceDeps);
      await s3Service.upload(Buffer.from('data'), validOptions);
      expect(s3Deps.attachmentRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ isEncrypted: true }),
      );
    });

    it('should generate correct path structure', async () => {
      await service.upload(Buffer.from('data'), {
        ...validOptions,
        moduleId: 'chat',
      });
      // Provider key should match pattern: {moduleId}/{YYYY-MM}/{generatedFileName}
      const uploadCall = deps.provider.upload.mock.calls[0];
      const key = uploadCall[0] as string;
      expect(key).toMatch(/^chat\/\d{4}-\d{2}\//);
    });
  });

  describe('download', () => {
    it('should download by attachment ID', async () => {
      await service.download('att-123');
      expect(deps.attachmentRepo.findById).toHaveBeenCalledWith('att-123');
      expect(deps.provider.download).toHaveBeenCalledWith(mockAttachment.providerKey);
    });

    it('should return error when attachment not found', async () => {
      deps.attachmentRepo.findById.mockResolvedValue(err(new AppError('storage.not_found')));
      const result = await service.download('missing-id');
      expect(result.isErr()).toBe(true);
    });
  });

  describe('delete', () => {
    it('should soft-delete and emit event', async () => {
      const result = await service.delete('att-123');
      expect(result.isOk()).toBe(true);
      expect(deps.attachmentRepo.delete).toHaveBeenCalledWith('att-123');
      expect(deps.eventBus.publish).toHaveBeenCalledWith(
        'storage.file.deleted',
        expect.objectContaining({
          attachmentId: 'att-123',
          permanent: false,
        }),
      );
    });

    it('should log EVENT_PUBLISH_FAILED on delete event failure', async () => {
      deps.eventBus.publish.mockResolvedValue(err(new AppError('event_bus.publish_failed')));
      const result = await service.delete('att-123');
      expect(result.isOk()).toBe(true);
      expect(deps.logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          code: STORAGE_ERRORS.EVENT_PUBLISH_FAILED,
          event: 'storage.file.deleted',
        }),
      );
    });
  });

  describe('getSignedUrl', () => {
    it('should return signed URL for attachment', async () => {
      const result = await service.getSignedUrl('att-123');
      expect(result.isOk()).toBe(true);
      expect(deps.provider.getSignedUrl).toHaveBeenCalledWith(mockAttachment.providerKey, 3600);
    });
  });

  describe('findByModuleAndEntity', () => {
    it('should delegate to repository', async () => {
      const result = await service.findByModuleAndEntity('chat', 'msg-123');
      expect(result.isOk()).toBe(true);
      expect(deps.attachmentRepo.findByModuleAndEntity).toHaveBeenCalledWith('chat', 'msg-123');
    });
  });
});
