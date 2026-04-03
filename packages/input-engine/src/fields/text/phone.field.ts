import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { AsyncResult } from '@tempot/shared';
import type { FieldHandler, RenderContext } from '../field.handler.js';
import type { FieldMetadata } from '../../input-engine.types.js';
import { INPUT_ENGINE_ERRORS } from '../../input-engine.errors.js';

const PHONE_REGEX = /^\+?[1-9]\d{1,14}$/;

export class PhoneFieldHandler implements FieldHandler {
  readonly fieldType = 'Phone' as const;

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

  validate(value: unknown, _schema: unknown, _metadata: FieldMetadata): Result<unknown, AppError> {
    const phone = value as string;

    if (!PHONE_REGEX.test(phone)) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED, {
          fieldType: this.fieldType,
          reason: 'Invalid phone format',
          value: phone,
        }),
      );
    }

    return ok(phone);
  }
}
