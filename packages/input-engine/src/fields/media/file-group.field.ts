import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { AsyncResult } from '@tempot/shared';
import type { FieldHandler, RenderContext } from '../field.handler.js';
import type { FieldMetadata } from '../../input-engine.types.js';
import { INPUT_ENGINE_ERRORS } from '../../input-engine.errors.js';

/** Telegram Document shape */
interface TelegramDocument {
  file_id: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
}

/** Telegram PhotoSize shape */
interface TelegramPhotoSize {
  file_id: string;
  file_unique_id: string;
  file_size?: number;
  width: number;
  height: number;
}

/** Single file in the group */
interface FileItem {
  fileId: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
}

const DEFAULT_MIN_FILES = 1;
const DEFAULT_MAX_FILES = 10;

/** Parse a single document from message */
function parseDocument(doc: TelegramDocument): FileItem {
  const result: FileItem = { fileId: doc.file_id };
  if (doc.file_name !== undefined) result.fileName = doc.file_name;
  if (doc.file_size !== undefined) result.fileSize = doc.file_size;
  if (doc.mime_type !== undefined) result.mimeType = doc.mime_type;
  return result;
}

/** Parse a photo array from message (take largest) */
function parsePhoto(photos: TelegramPhotoSize[]): FileItem {
  const largest = photos[photos.length - 1];
  const result: FileItem = { fileId: largest.file_id };
  if (largest.file_size !== undefined) result.fileSize = largest.file_size;
  return result;
}

/** Validate file count is within bounds */
function checkFileCount(
  bounds: { count: number; minFiles: number; maxFiles: number },
  fieldType: string,
): Result<void, AppError> {
  if (bounds.count < bounds.minFiles) {
    return err(
      new AppError(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED, {
        fieldType,
        reason: 'Too few files',
        minFiles: bounds.minFiles,
        actual: bounds.count,
      }),
    );
  }
  if (bounds.count > bounds.maxFiles) {
    return err(
      new AppError(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED, {
        fieldType,
        reason: 'Too many files',
        maxFiles: bounds.maxFiles,
        actual: bounds.count,
      }),
    );
  }
  return ok(undefined);
}

/** Check a single file size against maxSizeKB */
function checkFileSize(
  fileSize: number | undefined,
  maxSizeKB: number | undefined,
  fieldType: string,
): Result<void, AppError> {
  if (maxSizeKB !== undefined && fileSize !== undefined && fileSize > maxSizeKB * 1024) {
    return err(
      new AppError(INPUT_ENGINE_ERRORS.MEDIA_SIZE_EXCEEDED, {
        fieldType,
        maxSizeKB,
        actual: fileSize,
      }),
    );
  }
  return ok(undefined);
}

export class FileGroupFieldHandler implements FieldHandler {
  readonly fieldType = 'FileGroup' as const;

  async render(_renderCtx: RenderContext, _metadata: FieldMetadata): AsyncResult<void, AppError> {
    return ok(undefined);
  }

  parseResponse(message: unknown, _metadata: FieldMetadata): Result<unknown, AppError> {
    const msg = message as { document?: TelegramDocument; photo?: TelegramPhotoSize[] };
    if (msg.document) {
      return ok(parseDocument(msg.document));
    }
    if (msg.photo && msg.photo.length > 0) {
      return ok(parsePhoto(msg.photo));
    }
    return err(
      new AppError(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED, {
        fieldType: this.fieldType,
        reason: 'No file in message',
      }),
    );
  }

  validate(value: unknown, _schema: unknown, metadata: FieldMetadata): Result<unknown, AppError> {
    const files = value as FileItem[];
    const minFiles = metadata.minFiles ?? DEFAULT_MIN_FILES;
    const maxFiles = metadata.maxFiles ?? DEFAULT_MAX_FILES;

    const countCheck = checkFileCount({ count: files.length, minFiles, maxFiles }, this.fieldType);
    if (countCheck.isErr()) return countCheck;

    for (const file of files) {
      const sizeCheck = checkFileSize(file.fileSize, metadata.maxSizeKB, this.fieldType);
      if (sizeCheck.isErr()) return sizeCheck;
    }

    return ok(files);
  }
}
