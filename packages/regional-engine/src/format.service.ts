import { ok, err, type Result } from 'neverthrow';
import { AppError } from '@tempot/shared';

export class FormatService {
  formatCurrency(
    amount: number,
    locale: string = 'ar-EG',
    currency: string = 'EGP',
  ): Result<string, AppError> {
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

  formatNumber(value: number, locale: string = 'ar-EG'): Result<string, AppError> {
    try {
      return ok(new Intl.NumberFormat(locale).format(value));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new AppError('regional.invalid_locale', message));
    }
  }

  formatPercent(value: number, locale: string = 'ar-EG'): Result<string, AppError> {
    try {
      return ok(new Intl.NumberFormat(locale, { style: 'percent' }).format(value));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new AppError('regional.invalid_locale', message));
    }
  }
}
