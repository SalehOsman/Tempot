import { describe, it, expect } from 'vitest';
import { DEFAULT_STORAGE_CONFIG } from '../../src/types.js';
import { STORAGE_ERRORS } from '../../src/errors.js';

describe('Types & Contracts', () => {
  describe('DEFAULT_STORAGE_CONFIG', () => {
    it('should have 10MB max file size', () => {
      expect(DEFAULT_STORAGE_CONFIG.maxFileSize).toBe(10 * 1024 * 1024);
    });

    it('should have 9 allowed MIME types', () => {
      expect(DEFAULT_STORAGE_CONFIG.allowedMimeTypes).toHaveLength(9);
    });

    it('should default to local provider', () => {
      expect(DEFAULT_STORAGE_CONFIG.provider).toBe('local');
    });

    it('should have 30-day retention', () => {
      expect(DEFAULT_STORAGE_CONFIG.retention?.days).toBe(30);
    });

    it('should have cron schedule for 3 AM daily', () => {
      expect(DEFAULT_STORAGE_CONFIG.retention?.cronSchedule).toBe('0 3 * * *');
    });
  });

  describe('STORAGE_ERRORS', () => {
    it('should have provider error codes', () => {
      expect(STORAGE_ERRORS.PROVIDER_UNAVAILABLE).toBe('storage.provider.unavailable');
      expect(STORAGE_ERRORS.PROVIDER_AUTH_FAILED).toBe('storage.provider.auth_failed');
      expect(STORAGE_ERRORS.PROVIDER_QUOTA_EXCEEDED).toBe('storage.provider.quota_exceeded');
      expect(STORAGE_ERRORS.PROVIDER_UNKNOWN).toBe('storage.provider.unknown');
    });

    it('should have file operation error codes', () => {
      expect(STORAGE_ERRORS.UPLOAD_FAILED).toBe('storage.file.upload_failed');
      expect(STORAGE_ERRORS.DOWNLOAD_FAILED).toBe('storage.file.download_failed');
      expect(STORAGE_ERRORS.DELETE_FAILED).toBe('storage.file.delete_failed');
      expect(STORAGE_ERRORS.NOT_FOUND).toBe('storage.file.not_found');
      expect(STORAGE_ERRORS.SIGNED_URL_FAILED).toBe('storage.file.signed_url_failed');
    });

    it('should have validation error codes', () => {
      expect(STORAGE_ERRORS.FILE_TOO_LARGE).toBe('storage.validation.file_too_large');
      expect(STORAGE_ERRORS.MIME_NOT_ALLOWED).toBe('storage.validation.mime_not_allowed');
      expect(STORAGE_ERRORS.MIME_MISMATCH).toBe('storage.validation.mime_mismatch');
      expect(STORAGE_ERRORS.EMPTY_FILE).toBe('storage.validation.empty_file');
      expect(STORAGE_ERRORS.INVALID_FILENAME).toBe('storage.validation.invalid_filename');
    });

    it('should have rollback error code', () => {
      expect(STORAGE_ERRORS.ROLLBACK_FAILED).toBe('storage.rollback.cleanup_failed');
    });

    it('should have hard delete error code', () => {
      expect(STORAGE_ERRORS.HARD_DELETE_FAILED).toBe('storage.hard_delete_failed');
    });

    it('should have event publish error code', () => {
      expect(STORAGE_ERRORS.EVENT_PUBLISH_FAILED).toBe('storage.event.publish_failed');
    });

    it('should have exactly 17 error codes', () => {
      expect(Object.keys(STORAGE_ERRORS)).toHaveLength(17);
    });
  });
});
