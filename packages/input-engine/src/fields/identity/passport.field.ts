import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { AsyncResult } from '@tempot/shared';
import type { FieldHandler, RenderContext } from '../field.handler.js';
import type { FieldMetadata } from '../../input-engine.types.js';
import { INPUT_ENGINE_ERRORS } from '../../input-engine.errors.js';

const PASSPORT_PATTERN = /^[A-Z0-9]{6,9}$/;

export class PassportFieldHandler implements FieldHandler {
  readonly fieldType = 'PassportNumber' as const;

  async render(
    _renderCtx: RenderContext,
    _metadata: FieldMetadata,
  ): AsyncResult<unknown, AppError> {
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
    return ok(msg.text.trim().toUpperCase());
  }

  validate(value: unknown, _schema: unknown, _metadata: FieldMetadata): Result<unknown, AppError> {
    const passport = value as string;

    if (!PASSPORT_PATTERN.test(passport)) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED, {
          fieldType: this.fieldType,
          reason: 'Invalid passport number format',
          pattern: PASSPORT_PATTERN.source,
        }),
      );
    }

    return ok(passport);
  }
}
