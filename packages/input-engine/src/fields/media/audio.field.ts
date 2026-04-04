import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { AsyncResult } from '@tempot/shared';
import type { FieldHandler, RenderContext } from '../field.handler.js';
import type { FieldMetadata } from '../../input-engine.types.js';
import { INPUT_ENGINE_ERRORS } from '../../input-engine.errors.js';
import { checkFileSize } from './file-size.helper.js';
import { uploadToStorage, type UploadParams } from './storage-upload.helper.js';

/** Telegram Audio shape */
interface TelegramAudio {
  file_id: string;
  file_size?: number;
  duration?: number;
  mime_type?: string;
}

/** Parsed audio result */
interface AudioValue {
  fileId: string;
  fileSize?: number;
  duration?: number;
  mimeType?: string;
}

/** Check duration against maxDurationSeconds constraint */
function checkDuration(
  duration: number | undefined,
  maxDurationSeconds: number | undefined,
  fieldType: string,
): Result<void, AppError> {
  if (maxDurationSeconds !== undefined && duration !== undefined && duration > maxDurationSeconds) {
    return err(
      new AppError(INPUT_ENGINE_ERRORS.MEDIA_DURATION_EXCEEDED, {
        fieldType,
        maxDurationSeconds,
        actual: duration,
      }),
    );
  }
  return ok(undefined);
}

export class AudioFieldHandler implements FieldHandler {
  readonly fieldType = 'Audio' as const;

  async render(renderCtx: RenderContext, metadata: FieldMetadata): AsyncResult<unknown, AppError> {
    try {
      const ctx = renderCtx.ctx as {
        reply: (text: string, other?: Record<string, unknown>) => Promise<unknown>;
      };
      const conv = renderCtx.conversation as { waitFor: (filter: string) => Promise<unknown> };

      await ctx.reply(metadata.i18nKey);

      const response = await conv.waitFor('message:audio');
      return ok(response);
    } catch {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_RENDER_FAILED, { fieldType: this.fieldType }),
      );
    }
  }

  parseResponse(message: unknown, _metadata: FieldMetadata): Result<unknown, AppError> {
    const msg = message as { audio?: TelegramAudio };
    if (!msg.audio) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED, {
          fieldType: this.fieldType,
          reason: 'No audio in message',
        }),
      );
    }
    const aud = msg.audio;
    const result: AudioValue = { fileId: aud.file_id };
    if (aud.file_size !== undefined) result.fileSize = aud.file_size;
    if (aud.duration !== undefined) result.duration = aud.duration;
    if (aud.mime_type !== undefined) result.mimeType = aud.mime_type;
    return ok(result);
  }

  validate(value: unknown, _schema: unknown, metadata: FieldMetadata): Result<unknown, AppError> {
    const aud = value as AudioValue;
    const sizeCheck = checkFileSize(aud.fileSize, metadata.maxSizeKB, this.fieldType);
    if (sizeCheck.isErr()) return sizeCheck;

    const durationCheck = checkDuration(aud.duration, metadata.maxDurationSeconds, this.fieldType);
    if (durationCheck.isErr()) return durationCheck;

    return ok(aud);
  }

  async postProcess(
    value: unknown,
    renderCtx: RenderContext,
    _metadata: FieldMetadata,
  ): AsyncResult<unknown, AppError> {
    if (!renderCtx.storageClient || !renderCtx.logger) return ok(value);
    const aud = value as AudioValue;
    return uploadToStorage({
      fileId: aud.fileId,
      fileName: 'audio.mp3',
      mimeType: aud.mimeType ?? 'audio/mpeg',
      fileSize: aud.fileSize,
      conversation: renderCtx.conversation as UploadParams['conversation'],
      ctx: renderCtx.ctx as UploadParams['ctx'],
      storageClient: renderCtx.storageClient,
      logger: renderCtx.logger,
    });
  }
}
