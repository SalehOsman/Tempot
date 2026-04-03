import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { AsyncResult } from '@tempot/shared';
import type { FieldHandler, RenderContext } from '../field.handler.js';
import type { FieldMetadata } from '../../input-engine.types.js';
import { INPUT_ENGINE_ERRORS } from '../../input-engine.errors.js';

/** Callback data prefix for input-engine */
const CALLBACK_PREFIX = 'ie:';

/** Number of prefix segments before the value (ie:{formId}:{fieldIndex}:) */
const PREFIX_SEGMENT_COUNT = 3;

/** Default minimum star rating */
const DEFAULT_MIN = 1;

/** Default maximum star rating */
const DEFAULT_MAX = 5;

export class StarRatingFieldHandler implements FieldHandler {
  readonly fieldType = 'StarRating' as const;

  async render(_renderCtx: RenderContext, _metadata: FieldMetadata): AsyncResult<void, AppError> {
    return ok(undefined);
  }

  parseResponse(message: unknown, _metadata: FieldMetadata): Result<unknown, AppError> {
    const msg = message as { callback_query?: { data?: string } };
    if (!msg.callback_query?.data) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED, {
          fieldType: this.fieldType,
          reason: 'No callback_query data in message',
        }),
      );
    }

    const data = msg.callback_query.data;
    if (!data.startsWith(CALLBACK_PREFIX)) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED, {
          fieldType: this.fieldType,
          reason: 'Invalid callback data format',
        }),
      );
    }

    const parts = data.split(':');
    if (parts.length < PREFIX_SEGMENT_COUNT + 1) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED, {
          fieldType: this.fieldType,
          reason: 'Callback data missing value segment',
        }),
      );
    }

    const rawValue = parts[PREFIX_SEGMENT_COUNT];
    const rating = Number(rawValue);
    if (!Number.isInteger(rating)) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED, {
          fieldType: this.fieldType,
          reason: 'Rating value is not an integer',
          value: rawValue,
        }),
      );
    }

    return ok(rating);
  }

  validate(value: unknown, _schema: unknown, metadata: FieldMetadata): Result<unknown, AppError> {
    const rating = value as number;
    const min = metadata.min ?? DEFAULT_MIN;
    const max = metadata.max ?? DEFAULT_MAX;

    if (!Number.isInteger(rating)) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED, {
          fieldType: this.fieldType,
          reason: 'Rating must be an integer',
          value: rating,
        }),
      );
    }

    if (rating < min || rating > max) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED, {
          fieldType: this.fieldType,
          reason: 'Rating out of range',
          min,
          max,
          value: rating,
        }),
      );
    }

    return ok(rating);
  }
}
