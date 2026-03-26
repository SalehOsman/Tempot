import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ValidationService } from '../../src/validation.service.js';
import { DEFAULT_STORAGE_CONFIG } from '../../src/types.js';
import { STORAGE_ERRORS } from '../../src/errors.js';
import type { UploadOptions } from '../../src/types.js';

// Mock file-type
vi.mock('file-type', () => ({
  fileTypeFromBuffer: vi.fn(),
}));

describe('ValidationService', () => {
  let service: ValidationService;

  const validOptions: UploadOptions = {
    originalName: 'test-file.pdf',
    mimeType: 'application/pdf',
    size: 1024,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ValidationService(DEFAULT_STORAGE_CONFIG);
  });

  describe('validateUpload', () => {
    it('should accept a valid upload', () => {
      const result = service.validateUpload(validOptions);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.sanitizedName).toBe('test-file.pdf');
        expect(result.value.generatedFileName).toMatch(/^[0-9a-f-]+\.pdf$/);
      }
    });

    it('should reject empty files (size <= 0)', () => {
      const result = service.validateUpload({ ...validOptions, size: 0 });
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(STORAGE_ERRORS.EMPTY_FILE);
      }
    });

    it('should reject negative size files', () => {
      const result = service.validateUpload({ ...validOptions, size: -1 });
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(STORAGE_ERRORS.EMPTY_FILE);
      }
    });

    it('should reject oversized files', () => {
      const result = service.validateUpload({
        ...validOptions,
        size: DEFAULT_STORAGE_CONFIG.maxFileSize + 1,
      });
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(STORAGE_ERRORS.FILE_TOO_LARGE);
      }
    });

    it('should accept files at exactly the max size limit', () => {
      const result = service.validateUpload({
        ...validOptions,
        size: DEFAULT_STORAGE_CONFIG.maxFileSize,
      });
      expect(result.isOk()).toBe(true);
    });

    it('should reject disallowed MIME types', () => {
      const result = service.validateUpload({
        ...validOptions,
        mimeType: 'application/x-executable',
      });
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(STORAGE_ERRORS.MIME_NOT_ALLOWED);
      }
    });

    it('should sanitize path traversal from filename', () => {
      const result = service.validateUpload({
        ...validOptions,
        originalName: '../../../etc/passwd',
      });
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.sanitizedName).not.toContain('..');
        expect(result.value.sanitizedName).not.toContain('/');
      }
    });

    it('should strip special characters from filename', () => {
      const result = service.validateUpload({
        ...validOptions,
        originalName: 'file (copy) [2].pdf',
      });
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.sanitizedName).toMatch(/^[a-zA-Z0-9._-]+$/);
      }
    });

    it('should accept filenames that sanitize to only underscores', () => {
      const result = service.validateUpload({
        ...validOptions,
        originalName: '!!!',
      });
      // '!!!' sanitizes to '___' which is non-empty, so it's valid per spec
      expect(result.isOk()).toBe(true);
    });

    it('should reject filenames that sanitize to empty string', () => {
      const result = service.validateUpload({
        ...validOptions,
        originalName: '',
      });
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(STORAGE_ERRORS.INVALID_FILENAME);
      }
    });

    it('should generate UUID v7 filename with correct extension', () => {
      const result = service.validateUpload({
        ...validOptions,
        originalName: 'photo.jpeg',
      });
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.generatedFileName).toMatch(/\.jpeg$/);
      }
    });

    it('should handle files without extension', () => {
      const result = service.validateUpload({
        ...validOptions,
        originalName: 'Makefile',
      });
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        // UUID without extension
        expect(result.value.generatedFileName).toMatch(/^[0-9a-f-]+$/);
      }
    });
  });

  describe('validateMimeType', () => {
    it('should pass when declared MIME matches detected MIME', async () => {
      const { fileTypeFromBuffer } = await import('file-type');
      vi.mocked(fileTypeFromBuffer).mockResolvedValue({
        mime: 'application/pdf',
        ext: 'pdf',
      });

      const buffer = Buffer.from('fake-pdf-content');
      const result = await service.validateMimeType(buffer, 'application/pdf');
      expect(result.isOk()).toBe(true);
    });

    it('should fail when declared MIME does not match detected MIME', async () => {
      const { fileTypeFromBuffer } = await import('file-type');
      vi.mocked(fileTypeFromBuffer).mockResolvedValue({
        mime: 'image/png',
        ext: 'png',
      });

      const buffer = Buffer.from('fake-png-content');
      const result = await service.validateMimeType(buffer, 'application/pdf');
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe(STORAGE_ERRORS.MIME_MISMATCH);
      }
    });

    it('should skip check when file-type cannot detect (e.g., text/plain)', async () => {
      const { fileTypeFromBuffer } = await import('file-type');
      vi.mocked(fileTypeFromBuffer).mockResolvedValue(undefined);

      const buffer = Buffer.from('plain text content');
      const result = await service.validateMimeType(buffer, 'text/plain');
      expect(result.isOk()).toBe(true);
    });
  });

  describe('sanitizeFileName', () => {
    it('should strip path traversal via basename', () => {
      expect(service.sanitizeFileName('../../secret.txt')).toBe('secret.txt');
    });

    it('should replace special characters with underscores', () => {
      expect(service.sanitizeFileName('file name (1).pdf')).toBe('file_name__1_.pdf');
    });

    it('should preserve valid characters', () => {
      expect(service.sanitizeFileName('valid-file_name.test.pdf')).toBe('valid-file_name.test.pdf');
    });
  });
});
