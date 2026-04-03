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

/**
 * Hierarchical geo selection field handler (state -> city).
 * Accepts callback data from inline keyboards OR text input as fallback.
 */
export class GeoSelectFieldHandler implements FieldHandler {
  readonly fieldType = 'GeoSelectField' as const;

  async render(_renderCtx: RenderContext, _metadata: FieldMetadata): AsyncResult<void, AppError> {
    return ok(undefined);
  }

  parseResponse(message: unknown, _metadata: FieldMetadata): Result<unknown, AppError> {
    const msg = message as {
      callback_query?: { data?: string };
      text?: string;
    };

    // Try callback_query.data first (inline keyboard selection)
    if (msg.callback_query?.data) {
      return this.parseCallbackData(msg.callback_query.data);
    }

    // Fall back to text input
    if (msg.text) {
      const trimmed = msg.text.trim();
      if (trimmed.length > 0) {
        return ok(trimmed);
      }
    }

    return err(
      new AppError(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED, {
        fieldType: this.fieldType,
        reason: 'No callback data or text in message',
      }),
    );
  }

  validate(value: unknown, _schema: unknown, _metadata: FieldMetadata): Result<unknown, AppError> {
    const text = (value as string).trim();
    if (text.length < 1) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED, {
          fieldType: this.fieldType,
          reason: 'Value must be a non-empty string',
        }),
      );
    }
    return ok(text);
  }

  private parseCallbackData(data: string): Result<unknown, AppError> {
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

    const value = parts.slice(PREFIX_SEGMENT_COUNT).join(':');
    return ok(value);
  }
}
