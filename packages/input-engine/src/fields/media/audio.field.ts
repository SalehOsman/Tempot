import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { AsyncResult } from '@tempot/shared';
import type { FieldHandler, RenderContext } from '../field.handler.js';
import type { FieldMetadata } from '../../input-engine.types.js';
import { INPUT_ENGINE_ERRORS } from '../../input-engine.errors.js';
import { checkFileSize } from './file-size.helper.js';

/** Telegram Audio shape */
interface TelegramAudio {
  file_id: string;
  file_size?: number;
  duration?: number;
}

/** Parsed audio result */
interface AudioValue {
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

export class AudioFieldHandler implements FieldHandler {
  readonly fieldType = 'Audio' as const;

  async render(_renderCtx: RenderContext, _metadata: FieldMetadata): AsyncResult<void, AppError> {
    return ok(undefined);
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
}
