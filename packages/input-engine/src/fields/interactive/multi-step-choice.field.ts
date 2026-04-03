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

export class MultiStepChoiceFieldHandler implements FieldHandler {
  readonly fieldType = 'MultiStepChoice' as const;

  async render(_renderCtx: RenderContext, _metadata: FieldMetadata): AsyncResult<void, AppError> {
    return ok(undefined);
  }

  parseResponse(message: unknown, _metadata: FieldMetadata): Result<unknown, AppError> {
    const msg = message as { callback_query?: { data?: string }; text?: string };

    // Try callback data first
    if (msg.callback_query?.data) {
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

      const value = parts.slice(PREFIX_SEGMENT_COUNT).join(':');
      return ok(value);
    }

    // Fall back to text message
    if (msg.text) {
      return ok(msg.text.trim());
    }

    return err(
      new AppError(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED, {
        fieldType: this.fieldType,
        reason: 'No callback_query data or text in message',
      }),
    );
  }

  validate(value: unknown, _schema: unknown, _metadata: FieldMetadata): Result<unknown, AppError> {
    const selected = value as string;

    if (!selected || selected.length === 0) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED, {
          fieldType: this.fieldType,
          reason: 'Value must be a non-empty string',
        }),
      );
    }

    return ok(selected);
  }
}
