import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { AsyncResult } from '@tempot/shared';
import type { FieldHandler, RenderContext } from '../field.handler.js';
import type { FieldMetadata } from '../../input-engine.types.js';
import type { NationalIDResult } from '../../input-engine.field-results.js';
import { INPUT_ENGINE_ERRORS } from '../../input-engine.errors.js';
import { GOVERNORATE_CODES } from './governorate-codes.const.js';

const NATIONAL_ID_PATTERN = /^\d{14}$/;
const VALID_CENTURIES: Record<string, number> = { '2': 1900, '3': 2000 };

export class NationalIDFieldHandler implements FieldHandler {
  readonly fieldType = 'NationalID' as const;

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
    return ok(msg.text.trim());
  }

  validate(value: unknown, _schema: unknown, metadata: FieldMetadata): Result<unknown, AppError> {
    const id = value as string;

    if (!NATIONAL_ID_PATTERN.test(id)) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED, {
          fieldType: this.fieldType,
          reason: 'Must be exactly 14 digits',
        }),
      );
    }

    const centuryDigit = id[0];
    const centuryBase = VALID_CENTURIES[centuryDigit];
    if (centuryBase === undefined) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.NATIONAL_ID_CHECKSUM_FAILED, {
          fieldType: this.fieldType,
          reason: 'Invalid century digit',
          centuryDigit,
        }),
      );
    }

    const birthDateResult = this.extractBirthDate(id, centuryBase);
    if (birthDateResult.isErr()) {
      return birthDateResult;
    }

    if (!metadata.extractData) {
      return ok(id);
    }

    const govCode = id.substring(7, 9);
    const genderDigit = Number(id[12]);

    const result: NationalIDResult = {
      id,
      birthDate: birthDateResult.value,
      governorate: GOVERNORATE_CODES[govCode],
      gender: genderDigit % 2 === 0 ? 'female' : 'male',
    };

    return ok(result);
  }

  private extractBirthDate(id: string, centuryBase: number): Result<string, AppError> {
    const year = centuryBase + Number(id.substring(1, 3));
    const month = Number(id.substring(3, 5));
    const day = Number(id.substring(5, 7));

    const birthDate = new Date(year, month - 1, day);

    // Validate the date components match (catches invalid dates like Feb 30)
    const isValidDate =
      birthDate.getFullYear() === year &&
      birthDate.getMonth() === month - 1 &&
      birthDate.getDate() === day;

    if (!isValidDate) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED, {
          fieldType: 'NationalID',
          reason: 'Invalid birth date',
        }),
      );
    }

    if (birthDate > new Date()) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.NATIONAL_ID_FUTURE_DATE, {
          fieldType: 'NationalID',
          reason: 'Birth date is in the future',
        }),
      );
    }

    const iso = [String(year), String(month).padStart(2, '0'), String(day).padStart(2, '0')].join(
      '-',
    );

    return ok(iso);
  }
}
