import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { AsyncResult } from '@tempot/shared';
import type { FieldHandler, RenderContext } from '../field.handler.js';
import type { FieldMetadata } from '../../input-engine.types.js';
import { INPUT_ENGINE_ERRORS } from '../../input-engine.errors.js';
import { checkFileSize } from './file-size.helper.js';
import { uploadToStorage, type UploadParams } from './storage-upload.helper.js';

/** Telegram Document shape */
interface TelegramDocument {
  file_id: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
}

/** Parsed document result */
interface DocumentValue {
  fileId: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
}

/** Extract file extension from filename */
function extractExtension(fileName: string | undefined): string | undefined {
  if (!fileName) return undefined;
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot === -1) return undefined;
  return fileName.slice(lastDot).toLowerCase();
}

/** Check file extension against allowed list */
function checkExtension(
  fileName: string | undefined,
  allowedExtensions: string[] | undefined,
  fieldType: string,
): Result<void, AppError> {
  if (!allowedExtensions || allowedExtensions.length === 0) {
    return ok(undefined);
  }
  const ext = extractExtension(fileName);
  const normalizedAllowed = allowedExtensions.map((e) => e.toLowerCase());
  if (!ext || !normalizedAllowed.includes(ext)) {
    return err(
      new AppError(INPUT_ENGINE_ERRORS.MEDIA_TYPE_NOT_ALLOWED, {
        fieldType,
        allowedExtensions,
        actual: ext ?? 'unknown',
      }),
    );
  }
  return ok(undefined);
}

export class DocumentFieldHandler implements FieldHandler {
  readonly fieldType = 'Document' as const;

  async render(renderCtx: RenderContext, metadata: FieldMetadata): AsyncResult<unknown, AppError> {
    try {
      const ctx = renderCtx.ctx as {
        reply: (text: string, other?: Record<string, unknown>) => Promise<unknown>;
      };
      const conv = renderCtx.conversation as { waitFor: (filter: string) => Promise<unknown> };

      await ctx.reply(metadata.i18nKey);

      const response = await conv.waitFor('message:document');
      return ok(response);
    } catch {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_RENDER_FAILED, { fieldType: this.fieldType }),
      );
    }
  }

  parseResponse(message: unknown, _metadata: FieldMetadata): Result<unknown, AppError> {
    const msg = message as { document?: TelegramDocument };
    if (!msg.document) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED, {
          fieldType: this.fieldType,
          reason: 'No document in message',
        }),
      );
    }
    const doc = msg.document;
    const result: DocumentValue = { fileId: doc.file_id };
    if (doc.file_name !== undefined) result.fileName = doc.file_name;
    if (doc.file_size !== undefined) result.fileSize = doc.file_size;
    if (doc.mime_type !== undefined) result.mimeType = doc.mime_type;
    return ok(result);
  }

  validate(value: unknown, _schema: unknown, metadata: FieldMetadata): Result<unknown, AppError> {
    const doc = value as DocumentValue;
    const extCheck = checkExtension(doc.fileName, metadata.allowedExtensions, this.fieldType);
    if (extCheck.isErr()) return extCheck;

    const sizeCheck = checkFileSize(doc.fileSize, metadata.maxSizeKB, this.fieldType);
    if (sizeCheck.isErr()) return sizeCheck;

    return ok(doc);
  }

  async postProcess(
    value: unknown,
    renderCtx: RenderContext,
    _metadata: FieldMetadata,
  ): AsyncResult<unknown, AppError> {
    if (!renderCtx.storageClient || !renderCtx.logger) return ok(value);
    const doc = value as DocumentValue;
    return uploadToStorage({
      fileId: doc.fileId,
      fileName: doc.fileName,
      mimeType: doc.mimeType,
      fileSize: doc.fileSize,
      conversation: renderCtx.conversation as UploadParams['conversation'],
      ctx: renderCtx.ctx as UploadParams['ctx'],
      storageClient: renderCtx.storageClient,
      logger: renderCtx.logger,
    });
  }
}
