import { ok, err } from 'neverthrow';
import type { Result, AsyncResult } from '@tempot/shared';
import { AppError } from '@tempot/shared';
import { basename } from 'node:path';
import { v7 as uuidv7 } from 'uuid';
import { fileTypeFromBuffer } from 'file-type';
import type { StorageConfig, UploadOptions } from './types.js';
import { STORAGE_ERRORS } from './errors.js';

/** Sanitized file info after validation */
export interface ValidatedFile {
  sanitizedName: string;
  generatedFileName: string; // UUID v7 + ext
}

export class ValidationService {
  constructor(private readonly config: StorageConfig) {}

  /** Validate upload options against configured limits (synchronous checks) */
  validateUpload(options: UploadOptions): Result<ValidatedFile, AppError> {
    // 1. Check empty file
    if (options.size <= 0) {
      return err(new AppError(STORAGE_ERRORS.EMPTY_FILE));
    }

    // 2. Check file size
    if (options.size > this.config.maxFileSize) {
      return err(
        new AppError(STORAGE_ERRORS.FILE_TOO_LARGE, {
          size: options.size,
          maxSize: this.config.maxFileSize,
        }),
      );
    }

    // 3. Check MIME type against allowed list
    if (!this.config.allowedMimeTypes.includes(options.mimeType)) {
      return err(
        new AppError(STORAGE_ERRORS.MIME_NOT_ALLOWED, {
          mimeType: options.mimeType,
          allowed: this.config.allowedMimeTypes,
        }),
      );
    }

    // 4. Sanitize filename (D2: path.basename + strip special chars)
    const sanitizedName = this.sanitizeFileName(options.originalName);
    if (!sanitizedName) {
      return err(new AppError(STORAGE_ERRORS.INVALID_FILENAME));
    }

    // 5. Generate UUID v7 filename (D2)
    const ext = this.extractExtension(sanitizedName);
    const generatedFileName = `${uuidv7()}${ext}`;

    return ok({ sanitizedName, generatedFileName });
  }

  /**
   * Validate MIME type via magic bytes (Edge Case: MIME spoofing).
   *
   * @remarks
   * This method is only called for `Buffer` data. Stream uploads skip magic byte
   * detection entirely because buffering a stream would violate NFR-005 ("never load
   * entire file into memory") and would consume the stream, making it unreadable for
   * the subsequent provider upload.
   */
  async validateMimeType(data: Buffer, declaredMime: string): AsyncResult<void, AppError> {
    try {
      const detected = await fileTypeFromBuffer(data);
      // If file-type cannot detect (e.g., text/plain, text/csv), skip magic byte check
      if (detected && detected.mime !== declaredMime) {
        return err(
          new AppError(STORAGE_ERRORS.MIME_MISMATCH, {
            declared: declaredMime,
            detected: detected.mime,
          }),
        );
      }
      return ok(undefined);
    } catch {
      // If detection fails, allow — file-type may not support all formats
      return ok(undefined);
    }
  }

  /** Sanitize filename: path.basename + strip special chars (SC-004) */
  sanitizeFileName(name: string): string {
    const base = basename(name);
    return base.replace(/[^a-zA-Z0-9._-]/g, '_');
  }

  /** Extract file extension including the dot */
  private extractExtension(name: string): string {
    const lastDot = name.lastIndexOf('.');
    if (lastDot === -1 || lastDot === name.length - 1) return '';
    return name.slice(lastDot);
  }
}
