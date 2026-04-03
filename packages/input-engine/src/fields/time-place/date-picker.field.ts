import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { AsyncResult } from '@tempot/shared';
import type { FieldHandler, RenderContext } from '../field.handler.js';
import type { FieldMetadata } from '../../input-engine.types.js';
import { INPUT_ENGINE_ERRORS } from '../../input-engine.errors.js';

/** ISO date pattern: YYYY-MM-DD */
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/** Check if a string is a valid ISO 8601 date */
function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE_REGEX.test(value)) {
    return false;
  }
  return !isNaN(Date.parse(value));
}

/** Extract date string from callback data (format: "date:YYYY-MM-DD") */
function extractDateFromCallback(data: string): string | undefined {
  if (data.startsWith('date:')) {
    return data.slice(5);
  }
  return undefined;
}

/** Check date timestamp against min/max metadata constraints */
function checkDateRange(dateStr: string, metadata: FieldMetadata): Result<string, AppError> {
  const timestamp = Date.parse(dateStr);

  if (metadata.min !== undefined && timestamp < metadata.min) {
    return err(
      new AppError(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED, {
        fieldType: 'DatePicker',
        reason: 'Date before minimum',
        min: metadata.min,
        actual: timestamp,
      }),
    );
  }

  if (metadata.max !== undefined && timestamp > metadata.max) {
    return err(
      new AppError(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED, {
        fieldType: 'DatePicker',
        reason: 'Date after maximum',
        max: metadata.max,
        actual: timestamp,
      }),
    );
  }

  return ok(dateStr);
}

export class DatePickerFieldHandler implements FieldHandler {
  readonly fieldType = 'DatePicker' as const;

  async render(renderCtx: RenderContext, metadata: FieldMetadata): AsyncResult<unknown, AppError> {
    try {
      const ctx = renderCtx.ctx as {
        reply: (text: string, other?: Record<string, unknown>) => Promise<unknown>;
      };
      const conv = renderCtx.conversation as { waitFor: (filter: string) => Promise<unknown> };

      await ctx.reply(metadata.i18nKey);

      const response = await conv.waitFor('message:text');
      return ok(response);
    } catch {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_RENDER_FAILED, { fieldType: this.fieldType }),
      );
    }
  }

  parseResponse(message: unknown, _metadata: FieldMetadata): Result<unknown, AppError> {
    const msg = message as { text?: string; data?: string };
    const dateStr = this.extractDate(msg);

    if (!dateStr) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED, {
          fieldType: this.fieldType,
          reason: 'No date in message',
        }),
      );
    }

    if (!isValidIsoDate(dateStr)) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED, {
          fieldType: this.fieldType,
          reason: 'Invalid date format',
        }),
      );
    }

    return ok(dateStr);
  }

  validate(value: unknown, _schema: unknown, metadata: FieldMetadata): Result<unknown, AppError> {
    return checkDateRange(value as string, metadata);
  }

  /** Extract date string from text or callback data */
  private extractDate(msg: { text?: string; data?: string }): string | undefined {
    if (msg.data) {
      return extractDateFromCallback(msg.data) ?? msg.data;
    }
    if (msg.text) {
      return msg.text.trim();
    }
    return undefined;
  }
}
