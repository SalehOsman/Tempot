import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { AsyncResult } from '@tempot/shared';
import type { FieldHandler, RenderContext } from '../field.handler.js';
import type { FieldMetadata } from '../../input-engine.types.js';
import { INPUT_ENGINE_ERRORS } from '../../input-engine.errors.js';

const DEFAULT_MIN_PERCENTAGE = 0;
const DEFAULT_MAX_PERCENTAGE = 100;

export class PercentageFieldHandler implements FieldHandler {
  readonly fieldType = 'Percentage' as const;

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
    let text = msg.text.trim();
    if (text.endsWith('%')) {
      text = text.slice(0, -1).trim();
    }
    return ok(parseFloat(text));
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

    const min = metadata.min ?? DEFAULT_MIN_PERCENTAGE;
    const max = metadata.max ?? DEFAULT_MAX_PERCENTAGE;

    if (num < min) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED, {
          fieldType: this.fieldType,
          reason: 'Value below minimum',
          min,
          actual: num,
        }),
      );
    }

    if (num > max) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED, {
          fieldType: this.fieldType,
          reason: 'Value above maximum',
          max,
          actual: num,
        }),
      );
    }

    return ok(num);
  }
}
