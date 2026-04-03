import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { AsyncResult } from '@tempot/shared';
import type { FieldHandler, RenderContext } from '../field.handler.js';
import type { FieldMetadata } from '../../input-engine.types.js';
import { INPUT_ENGINE_ERRORS } from '../../input-engine.errors.js';

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

export class UrlFieldHandler implements FieldHandler {
  readonly fieldType = 'URL' as const;

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
    const urlString = value as string;

    let parsed: URL;
    try {
      parsed = new URL(urlString);
    } catch {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED, {
          fieldType: this.fieldType,
          reason: 'Invalid URL format',
          value: urlString,
        }),
      );
    }

    if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED, {
          fieldType: this.fieldType,
          reason: 'Unsupported protocol',
          protocol: parsed.protocol,
          value: urlString,
        }),
      );
    }

    return ok(urlString);
  }
}
