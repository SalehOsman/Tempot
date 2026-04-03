import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { AsyncResult } from '@tempot/shared';
import type { FieldHandler, RenderContext } from '../field.handler.js';
import type { FieldMetadata } from '../../input-engine.types.js';
import { INPUT_ENGINE_ERRORS } from '../../input-engine.errors.js';

export class RegexValidatedFieldHandler implements FieldHandler {
  readonly fieldType = 'RegexValidated' as const;

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

    if (!metadata.pattern) {
      return ok(text);
    }

    if (!metadata.pattern.test(text)) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED, {
          fieldType: this.fieldType,
          reason: 'Input does not match required pattern',
          pattern: metadata.pattern.source,
          value: text,
        }),
      );
    }

    return ok(text);
  }
}
