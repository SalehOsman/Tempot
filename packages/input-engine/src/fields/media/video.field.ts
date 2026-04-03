import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { AsyncResult } from '@tempot/shared';
import type { FieldHandler, RenderContext } from '../field.handler.js';
import type { FieldMetadata } from '../../input-engine.types.js';
import { INPUT_ENGINE_ERRORS } from '../../input-engine.errors.js';
import { checkFileSize } from './file-size.helper.js';

/** Telegram Video shape */
interface TelegramVideo {
  file_id: string;
  file_size?: number;
  duration?: number;
}

/** Parsed video result */
interface VideoValue {
  fileId: string;
  fileSize?: number;
  duration?: number;
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

export class VideoFieldHandler implements FieldHandler {
  readonly fieldType = 'Video' as const;

  async render(_renderCtx: RenderContext, _metadata: FieldMetadata): AsyncResult<void, AppError> {
    return ok(undefined);
  }

  parseResponse(message: unknown, _metadata: FieldMetadata): Result<unknown, AppError> {
    const msg = message as { video?: TelegramVideo };
    if (!msg.video) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED, {
          fieldType: this.fieldType,
          reason: 'No video in message',
        }),
      );
    }
    const vid = msg.video;
    const result: VideoValue = { fileId: vid.file_id };
    if (vid.file_size !== undefined) result.fileSize = vid.file_size;
    if (vid.duration !== undefined) result.duration = vid.duration;
    return ok(result);
  }

  validate(value: unknown, _schema: unknown, metadata: FieldMetadata): Result<unknown, AppError> {
    const vid = value as VideoValue;
    const sizeCheck = checkFileSize(vid.fileSize, metadata.maxSizeKB, this.fieldType);
    if (sizeCheck.isErr()) return sizeCheck;

    const durationCheck = checkDuration(vid.duration, metadata.maxDurationSeconds, this.fieldType);
    if (durationCheck.isErr()) return durationCheck;

    return ok(vid);
  }
}
