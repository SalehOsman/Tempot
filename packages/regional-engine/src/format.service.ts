import { ok, err, type Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { DEFAULT_REGIONAL_CONTEXT } from './regional.types.js';
import { regionalToggle } from './regional.toggle.js';

export class FormatService {
  formatCurrency(
    amount: number,
    locale: string = DEFAULT_REGIONAL_CONTEXT.locale,
    currency: string = DEFAULT_REGIONAL_CONTEXT.currencyCode,
  ): Result<string, AppError> {
    const disabled = regionalToggle.check();
    if (disabled) return disabled;

    try {
      const formatted = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        currencyDisplay: 'symbol',
      }).format(amount);
      return ok(formatted);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new AppError('regional.invalid_locale', message));
    }
  }

  formatNumber(
    value: number,
    locale: string = DEFAULT_REGIONAL_CONTEXT.locale,
  ): Result<string, AppError> {
    const disabled = regionalToggle.check();
    if (disabled) return disabled;

    try {
      return ok(new Intl.NumberFormat(locale).format(value));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new AppError('regional.invalid_locale', message));
    }
  }

  formatPercent(
    value: number,
    locale: string = DEFAULT_REGIONAL_CONTEXT.locale,
  ): Result<string, AppError> {
    const disabled = regionalToggle.check();
    if (disabled) return disabled;

    try {
      return ok(new Intl.NumberFormat(locale, { style: 'percent' }).format(value));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new AppError('regional.invalid_locale', message));
    }
  }
}
