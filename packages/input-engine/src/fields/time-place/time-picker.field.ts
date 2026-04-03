import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { AsyncResult } from '@tempot/shared';
import type { FieldHandler, RenderContext } from '../field.handler.js';
import type { FieldMetadata } from '../../input-engine.types.js';
import { INPUT_ENGINE_ERRORS } from '../../input-engine.errors.js';

/** 24-hour time pattern: H:MM or HH:MM */
const TIME_24H_REGEX = /^(\d{1,2}):(\d{2})$/;

/** 12-hour time pattern: H:MM AM/PM */
const TIME_12H_REGEX = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i;

/** Parse 24-hour time string into hours and minutes */
function parse24HourTime(text: string): { hours: number; minutes: number } | undefined {
  const match = TIME_24H_REGEX.exec(text.trim());
  if (!match) {
    return undefined;
  }
  return { hours: parseInt(match[1], 10), minutes: parseInt(match[2], 10) };
}

/** Parse 12-hour time string into 24-hour hours and minutes */
function parse12HourTime(text: string): { hours: number; minutes: number } | undefined {
  const match = TIME_12H_REGEX.exec(text.trim());
  if (!match) {
    return undefined;
  }
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();

  if (hours === 12) {
    hours = period === 'AM' ? 0 : 12;
  } else if (period === 'PM') {
    hours += 12;
  }

  return { hours, minutes };
}

/** Format hours and minutes as HH:MM */
function formatTime(hours: number, minutes: number): string {
  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  return `${hh}:${mm}`;
}

export class TimePickerFieldHandler implements FieldHandler {
  readonly fieldType = 'TimePicker' as const;

  async render(
    _renderCtx: RenderContext,
    _metadata: FieldMetadata,
  ): AsyncResult<unknown, AppError> {
    return ok(undefined);
  }

  parseResponse(message: unknown, metadata: FieldMetadata): Result<unknown, AppError> {
    const msg = message as { text?: string };
    if (!msg.text) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED, {
          fieldType: this.fieldType,
          reason: 'No text in message',
        }),
      );
    }

    const parsed = this.parseTimeText(msg.text, metadata);
    if (!parsed) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED, {
          fieldType: this.fieldType,
          reason: 'Invalid time format',
        }),
      );
    }

    return ok(formatTime(parsed.hours, parsed.minutes));
  }

  validate(value: unknown, _schema: unknown, _metadata: FieldMetadata): Result<unknown, AppError> {
    const timeStr = value as string;
    const parsed = parse24HourTime(timeStr);

    if (!parsed) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED, {
          fieldType: this.fieldType,
          reason: 'Invalid time format',
        }),
      );
    }

    if (parsed.hours < 0 || parsed.hours > 23) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED, {
          fieldType: this.fieldType,
          reason: 'Hours out of range (0-23)',
          actual: parsed.hours,
        }),
      );
    }

    if (parsed.minutes < 0 || parsed.minutes > 59) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED, {
          fieldType: this.fieldType,
          reason: 'Minutes out of range (0-59)',
          actual: parsed.minutes,
        }),
      );
    }

    return ok(timeStr);
  }

  /** Parse time text based on format preference */
  private parseTimeText(
    text: string,
    metadata: FieldMetadata,
  ): { hours: number; minutes: number } | undefined {
    if (metadata.use12Hour) {
      return parse12HourTime(text) ?? parse24HourTime(text);
    }
    return parse24HourTime(text);
  }
}
