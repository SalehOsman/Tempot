import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { AsyncResult } from '@tempot/shared';
import type { FieldHandler, RenderContext } from '../field.handler.js';
import type { FieldMetadata } from '../../input-engine.types.js';
import { INPUT_ENGINE_ERRORS } from '../../input-engine.errors.js';

export class IntegerFieldHandler implements FieldHandler {
  readonly fieldType = 'Integer' as const;

  async render(_renderCtx: RenderContext, _metadata: FieldMetadata): AsyncResult<void, AppError> {
    return ok(undefined);
  }

  parseResponse(message: unknown, _metadata: FieldMetadata): Result<unknown, AppError> {
    const msg = message as { text?: string };
    if (!msg.text) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED, {
          fieldType: this.fieldType,
          reason: 'No text in message',
        }),
      );
    }
    return ok(parseInt(msg.text.trim(), 10));
  }

  validate(value: unknown, _schema: unknown, metadata: FieldMetadata): Result<unknown, AppError> {
    const num = value as number;

    if (isNaN(num)) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED, {
          fieldType: this.fieldType,
          reason: 'Value is not a number',
        }),
      );
    }

    if (!Number.isInteger(num)) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED, {
          fieldType: this.fieldType,
          reason: 'Value is not an integer',
          actual: num,
        }),
      );
    }

    if (metadata.min !== undefined && num < metadata.min) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED, {
          fieldType: this.fieldType,
          reason: 'Value below minimum',
          min: metadata.min,
          actual: num,
        }),
      );
    }

    if (metadata.max !== undefined && num > metadata.max) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED, {
          fieldType: this.fieldType,
          reason: 'Value above maximum',
          max: metadata.max,
          actual: num,
        }),
      );
    }

    return ok(num);
  }
}
