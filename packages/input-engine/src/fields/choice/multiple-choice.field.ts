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

export class MultipleChoiceFieldHandler implements FieldHandler {
  readonly fieldType = 'MultipleChoice' as const;

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

    // Value is a comma-separated list of selected values
    const rawValue = parts.slice(PREFIX_SEGMENT_COUNT).join(':');
    const selectedValues = rawValue.split(',');
    return ok(selectedValues);
  }

  validate(value: unknown, _schema: unknown, metadata: FieldMetadata): Result<unknown, AppError> {
    if (!Array.isArray(value)) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED, {
          fieldType: this.fieldType,
          reason: 'Value must be an array',
        }),
      );
    }

    const selectedValues = value as string[];
    const options = metadata.options ?? [];
    const minSelections = metadata.minSelections ?? 1;
    const maxSelections = metadata.maxSelections ?? Infinity;

    // Check each value is in options
    for (const selected of selectedValues) {
      const found = options.some((opt) => opt.value === selected);
      if (!found) {
        return err(
          new AppError(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED, {
            fieldType: this.fieldType,
            reason: 'Value not in options',
            value: selected,
          }),
        );
      }
    }

    if (selectedValues.length < minSelections) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED, {
          fieldType: this.fieldType,
          reason: 'Below minimum selections',
          minSelections,
          actual: selectedValues.length,
        }),
      );
    }

    if (selectedValues.length > maxSelections) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED, {
          fieldType: this.fieldType,
          reason: 'Above maximum selections',
          maxSelections,
          actual: selectedValues.length,
        }),
      );
    }

    return ok(selectedValues);
  }
}
