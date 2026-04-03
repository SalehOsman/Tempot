import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { INPUT_ENGINE_ERRORS } from '../../input-engine.errors.js';

/** Check file size against maxSizeKB constraint */
export function checkFileSize(
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
