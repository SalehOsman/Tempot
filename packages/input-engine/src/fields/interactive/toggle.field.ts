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

export class ToggleFieldHandler implements FieldHandler {
  readonly fieldType = 'Toggle' as const;

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
    if (rawValue === 'true') {
      return ok(true);
    }
    if (rawValue === 'false') {
      return ok(false);
    }

    return err(
      new AppError(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED, {
        fieldType: this.fieldType,
        reason: 'Invalid boolean value in callback data',
        value: rawValue,
      }),
    );
  }

  validate(value: unknown, _schema: unknown, _metadata: FieldMetadata): Result<unknown, AppError> {
    if (typeof value !== 'boolean') {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED, {
          fieldType: this.fieldType,
          reason: 'Value is not a boolean',
          value,
        }),
      );
    }

    return ok(value);
  }
}
