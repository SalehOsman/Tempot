import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { AsyncResult } from '@tempot/shared';
import type { FieldHandler, RenderContext } from '../field.handler.js';
import type { FieldMetadata } from '../../input-engine.types.js';
import type { EgyptianMobileResult } from '../../input-engine.field-results.js';
import { INPUT_ENGINE_ERRORS } from '../../input-engine.errors.js';

const EGYPTIAN_MOBILE_PATTERN = /^01[0125]\d{8}$/;

const OPERATOR_MAP: Record<string, string> = {
  '0': 'Vodafone',
  '1': 'Etisalat',
  '2': 'Orange',
  '5': 'WE',
};

export class EgyptianMobileFieldHandler implements FieldHandler {
  readonly fieldType = 'EgyptianMobile' as const;

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

    let text = msg.text.trim();
    if (text.startsWith('+20')) {
      text = '0' + text.slice(3);
    } else if (text.startsWith('0020')) {
      text = text.slice(4);
    }

    return ok(text);
  }

  validate(value: unknown, _schema: unknown, _metadata: FieldMetadata): Result<unknown, AppError> {
    const phone = value as string;

    if (!EGYPTIAN_MOBILE_PATTERN.test(phone)) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED, {
          fieldType: this.fieldType,
          reason: 'Invalid Egyptian mobile number format',
        }),
      );
    }

    const operatorDigit = phone[2];
    const result: EgyptianMobileResult = {
      number: phone,
      countryCode: '+20',
      operator: OPERATOR_MAP[operatorDigit],
    };

    return ok(result);
  }
}
