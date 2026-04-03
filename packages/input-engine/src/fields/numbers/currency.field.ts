import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { AsyncResult } from '@tempot/shared';
import type { FieldHandler, RenderContext } from '../field.handler.js';
import type { FieldMetadata } from '../../input-engine.types.js';
import { INPUT_ENGINE_ERRORS } from '../../input-engine.errors.js';
import { normalizeArabicNumerals } from './arabic-numerals.helper.js';

/** Check if a number has more than the allowed decimal places */
function hasExcessDecimalPlaces(num: number, maxPlaces: number): boolean {
  const str = String(num);
  const dotIndex = str.indexOf('.');
  if (dotIndex === -1) {
    return false;
  }
  return str.length - dotIndex - 1 > maxPlaces;
}

export class CurrencyFieldHandler implements FieldHandler {
  readonly fieldType = 'Currency' as const;

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
    const normalized = normalizeArabicNumerals(msg.text.trim());
    return ok(parseFloat(normalized));
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

    if (num < 0) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED, {
          fieldType: this.fieldType,
          reason: 'Currency value must be positive',
          actual: num,
        }),
      );
    }

    if (hasExcessDecimalPlaces(num, 2)) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED, {
          fieldType: this.fieldType,
          reason: 'Currency value must have at most 2 decimal places',
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
