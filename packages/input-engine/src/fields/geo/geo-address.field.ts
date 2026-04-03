import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { AsyncResult } from '@tempot/shared';
import type { FieldHandler, RenderContext } from '../field.handler.js';
import type { FieldMetadata } from '../../input-engine.types.js';
import { INPUT_ENGINE_ERRORS } from '../../input-engine.errors.js';

/**
 * Freeform address text input with optional location sharing.
 * Accepts text messages or location messages (latitude/longitude).
 */
export class GeoAddressFieldHandler implements FieldHandler {
  readonly fieldType = 'GeoAddressField' as const;

  async render(_renderCtx: RenderContext, _metadata: FieldMetadata): AsyncResult<void, AppError> {
    return ok(undefined);
  }

  parseResponse(message: unknown, _metadata: FieldMetadata): Result<unknown, AppError> {
    const msg = message as {
      text?: string;
      location?: { latitude: number; longitude: number };
    };

    // Prefer location if provided
    if (msg.location) {
      return ok(`${msg.location.latitude},${msg.location.longitude}`);
    }

    // Fall back to text input
    if (msg.text) {
      const trimmed = msg.text.trim();
      if (trimmed.length > 0) {
        return ok(trimmed);
      }
    }

    return err(
      new AppError(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED, {
        fieldType: this.fieldType,
        reason: 'No text or location in message',
      }),
    );
  }

  validate(value: unknown, _schema: unknown, _metadata: FieldMetadata): Result<unknown, AppError> {
    const text = (value as string).trim();
    if (text.length < 1) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED, {
          fieldType: this.fieldType,
          reason: 'Value must be a non-empty string',
        }),
      );
    }
    return ok(text);
  }
}
