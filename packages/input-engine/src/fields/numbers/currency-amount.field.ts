import { ok, err } from 'neverthrow';
import type { Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { AsyncResult } from '@tempot/shared';
import type { FieldHandler, RenderContext } from '../field.handler.js';
import type { FieldMetadata, CurrencyAmountResult } from '../../input-engine.types.js';
import { INPUT_ENGINE_ERRORS } from '../../input-engine.errors.js';

const DEFAULT_DECIMAL_PLACES = 2;
const FIELD_TYPE = 'CurrencyAmount' as const;

/** Normalize Arabic-Indic numerals (٠-٩) to Western Arabic (0-9) */
function normalizeArabicNumerals(text: string): string {
  return text.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}

/** Check if a number has more than the allowed decimal places */
function hasExcessDecimalPlaces(num: number, maxPlaces: number): boolean {
  const str = String(num);
  const dotIndex = str.indexOf('.');
  if (dotIndex === -1) {
    return false;
  }
  return str.length - dotIndex - 1 > maxPlaces;
}

/** Create a validation error for currency amount */
function validationErr(
  reason: string,
  details?: Record<string, unknown>,
): Result<unknown, AppError> {
  return err(
    new AppError(INPUT_ENGINE_ERRORS.FIELD_VALIDATION_FAILED, {
      fieldType: FIELD_TYPE,
      reason,
      ...details,
    }),
  );
}

/** Validate the numeric amount value */
function validateAmount(
  amount: number,
  decimalPlaces: number,
  metadata: FieldMetadata,
): Result<unknown, AppError> | undefined {
  if (isNaN(amount)) return validationErr('Amount is not a number');
  if (amount < 0) return validationErr('Amount must be positive', { actual: amount });
  if (hasExcessDecimalPlaces(amount, decimalPlaces)) {
    return validationErr('Too many decimal places', {
      maxDecimalPlaces: decimalPlaces,
      actual: amount,
    });
  }
  if (metadata.min !== undefined && amount < metadata.min) {
    return validationErr('Amount below minimum', { min: metadata.min, actual: amount });
  }
  if (metadata.max !== undefined && amount > metadata.max) {
    return validationErr('Amount above maximum', { max: metadata.max, actual: amount });
  }
  return undefined;
}

export class CurrencyAmountFieldHandler implements FieldHandler {
  readonly fieldType = FIELD_TYPE;

  async render(_renderCtx: RenderContext, _metadata: FieldMetadata): AsyncResult<void, AppError> {
    return ok(undefined);
  }

  parseResponse(message: unknown, metadata: FieldMetadata): Result<unknown, AppError> {
    const msg = message as { text?: string };
    if (!msg.text) {
      return err(
        new AppError(INPUT_ENGINE_ERRORS.FIELD_PARSE_FAILED, {
          fieldType: this.fieldType,
          reason: 'No text in message',
        }),
      );
    }

    const normalized = normalizeArabicNumerals(msg.text.trim());
    const parts = normalized.split(/\s+/);
    const amount = parseFloat(parts[0] ?? '');
    const currency = parts[1] ?? metadata.currency ?? '';

    return ok({ amount, currency } satisfies CurrencyAmountResult);
  }

  validate(value: unknown, _schema: unknown, metadata: FieldMetadata): Result<unknown, AppError> {
    const input = value as CurrencyAmountResult;
    const { amount, currency } = input;
    const decimalPlaces = metadata.decimalPlaces ?? DEFAULT_DECIMAL_PLACES;

    const amountError = validateAmount(amount, decimalPlaces, metadata);
    if (amountError) return amountError;

    if (metadata.allowedCurrencies && !metadata.allowedCurrencies.includes(currency)) {
      return validationErr('Currency not allowed', {
        allowedCurrencies: metadata.allowedCurrencies,
        actual: currency,
      });
    }

    return ok({ amount, currency } satisfies CurrencyAmountResult);
  }
}
