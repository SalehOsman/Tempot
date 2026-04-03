import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { AsyncResult } from '@tempot/shared';
import type { FieldHandler, RenderContext } from '../field.handler.js';
import type { FieldMetadata } from '../../input-engine.types.js';
import { INPUT_ENGINE_ERRORS } from '../../input-engine.errors.js';
import { IBAN_LENGTHS } from './iban-lengths.const.js';
import { validateMod97 } from './iban-checksum.helper.js';

export class IBANFieldHandler implements FieldHandler {
  readonly fieldType = 'IBAN' as const;

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
    return ok(msg.text.replace(/\s/g, '').toUpperCase());
  }

  validate(value: unknown, _schema: unknown, metadata: FieldMetadata): Result<unknown, AppError> {
    const raw = (value as string).replace(/\s/g, '').toUpperCase();
    const countryCode = raw.substring(0, 2);

    const expectedLength = IBAN_LENGTHS[countryCode];
    if (expectedLength === undefined) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED, {
          fieldType: this.fieldType,
          reason: 'Unsupported country code',
          countryCode,
        }),
      );
    }

    if (raw.length !== expectedLength) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED, {
          fieldType: this.fieldType,
          reason: 'Invalid IBAN length',
          expected: expectedLength,
          actual: raw.length,
        }),
      );
    }

    if (metadata.allowedCountries && !metadata.allowedCountries.includes(countryCode)) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.IBAN_COUNTRY_NOT_ALLOWED, {
          fieldType: this.fieldType,
          reason: 'Country not allowed',
          countryCode,
          allowedCountries: metadata.allowedCountries,
        }),
      );
    }

    if (!validateMod97(raw)) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.IBAN_INVALID_CHECKSUM, {
          fieldType: this.fieldType,
          reason: 'Invalid IBAN checksum',
        }),
      );
    }

    return ok(raw);
  }
}
