import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { AsyncResult } from '@tempot/shared';
import type { FieldHandler, RenderContext } from '../field.handler.js';
import type { FieldMetadata } from '../../input-engine.types.js';
import { INPUT_ENGINE_ERRORS } from '../../input-engine.errors.js';
import { checkFileSize } from './file-size.helper.js';

/** Telegram PhotoSize shape */
interface TelegramPhotoSize {
  file_id: string;
  file_unique_id: string;
  file_size?: number;
  width: number;
  height: number;
}

/** Parsed photo result */
interface PhotoValue {
  fileId: string;
  fileSize?: number;
}

export class PhotoFieldHandler implements FieldHandler {
  readonly fieldType = 'Photo' as const;

  async render(renderCtx: RenderContext, metadata: FieldMetadata): AsyncResult<unknown, AppError> {
    try {
      const ctx = renderCtx.ctx as {
        reply: (text: string, other?: Record<string, unknown>) => Promise<unknown>;
      };
      const conv = renderCtx.conversation as { waitFor: (filter: string) => Promise<unknown> };

      await ctx.reply(metadata.i18nKey);

      const response = await conv.waitFor('message:photo');
      return ok(response);
    } catch {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_RENDER_FAILED, { fieldType: this.fieldType }),
      );
    }
  }

  parseResponse(message: unknown, _metadata: FieldMetadata): Result<unknown, AppError> {
    const msg = message as { photo?: TelegramPhotoSize[] };
    if (!msg.photo || msg.photo.length === 0) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED, {
          fieldType: this.fieldType,
          reason: 'No photo in message',
        }),
      );
    }
    const largest = msg.photo[msg.photo.length - 1];
    const result: PhotoValue = { fileId: largest.file_id };
    if (largest.file_size !== undefined) {
      result.fileSize = largest.file_size;
    }
    return ok(result);
  }

  validate(value: unknown, _schema: unknown, metadata: FieldMetadata): Result<unknown, AppError> {
    const photo = value as PhotoValue;
    const sizeCheck = checkFileSize(photo.fileSize, metadata.maxSizeKB, this.fieldType);
    if (sizeCheck.isErr()) {
      return sizeCheck;
    }
    return ok(photo);
  }
}
