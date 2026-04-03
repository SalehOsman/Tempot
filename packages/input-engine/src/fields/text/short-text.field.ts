import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { AsyncResult } from '@tempot/shared';
import type { FieldHandler, RenderContext } from '../field.handler.js';
import type { FieldMetadata } from '../../input-engine.types.js';
import { INPUT_ENGINE_ERRORS } from '../../input-engine.errors.js';

const DEFAULT_MIN_LENGTH = 1;
const DEFAULT_MAX_LENGTH = 255;

export class ShortTextFieldHandler implements FieldHandler {
  readonly fieldType = 'ShortText' as const;

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
    return ok(msg.text.trim());
  }

  validate(value: unknown, _schema: unknown, metadata: FieldMetadata): Result<unknown, AppError> {
    const text = value as string;
    const minLength = metadata.minLength ?? DEFAULT_MIN_LENGTH;
    const maxLength = metadata.maxLength ?? DEFAULT_MAX_LENGTH;

    if (text.length < minLength) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED, {
          fieldType: this.fieldType,
          reason: 'Text too short',
          minLength,
          actual: text.length,
        }),
      );
    }

    if (text.length > maxLength) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED, {
          fieldType: this.fieldType,
          reason: 'Text too long',
          maxLength,
          actual: text.length,
        }),
      );
    }

    return ok(text);
  }
}
