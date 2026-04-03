import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { AsyncResult } from '@tempot/shared';
import type { FieldHandler, RenderContext } from '../field.handler.js';
import type { FieldMetadata } from '../../input-engine.types.js';
import { INPUT_ENGINE_ERRORS } from '../../input-engine.errors.js';

/** ISO date pattern: YYYY-MM-DD */
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/** Parsed date range value */
interface DateRangeValue {
  startDate: string;
  endDate: string;
}

/** Check if a string is a valid ISO 8601 date */
function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE_REGEX.test(value)) {
    return false;
  }
  return !isNaN(Date.parse(value));
}

/** Split input text into two date parts using " - " or " to " */
function splitDateRange(text: string): [string, string] | undefined {
  const dashParts = text.split(' - ');
  if (dashParts.length === 2) {
    return [dashParts[0].trim(), dashParts[1].trim()];
  }
  const toParts = text.split(' to ');
  if (toParts.length === 2) {
    return [toParts[0].trim(), toParts[1].trim()];
  }
  return undefined;
}

export class DateRangeFieldHandler implements FieldHandler {
  readonly fieldType = 'DateRange' as const;

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

    const parts = splitDateRange(msg.text);
    if (!parts) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED, {
          fieldType: this.fieldType,
          reason: 'Invalid date range format',
        }),
      );
    }

    if (!isValidIsoDate(parts[0]) || !isValidIsoDate(parts[1])) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED, {
          fieldType: this.fieldType,
          reason: 'Invalid date in range',
        }),
      );
    }

    const result: DateRangeValue = { startDate: parts[0], endDate: parts[1] };
    return ok(result);
  }

  validate(value: unknown, _schema: unknown, _metadata: FieldMetadata): Result<unknown, AppError> {
    const range = value as DateRangeValue;
    const startTs = Date.parse(range.startDate);
    const endTs = Date.parse(range.endDate);

    if (endTs < startTs) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED, {
          fieldType: this.fieldType,
          reason: 'End date must be >= start date',
          startDate: range.startDate,
          endDate: range.endDate,
        }),
      );
    }

    return ok(range);
  }
}
