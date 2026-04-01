import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import localizedFormat from 'dayjs/plugin/localizedFormat.js';
import 'dayjs/locale/ar.js';
import { ok, err, type Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { DEFAULT_REGIONAL_CONTEXT } from './regional.types.js';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(localizedFormat);

/** Default dayjs locale code — distinct from Intl locale (e.g., 'ar-EG') */
const DEFAULT_DAYJS_LOCALE = 'ar';

/**
 * Validates a timezone string by checking if Intl.DateTimeFormat accepts it.
 * dayjs silently falls back to UTC for invalid timezones, so we must validate first.
 */
function isValidTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates a locale string using Intl.DateTimeFormat.
 * dayjs silently falls back to English for invalid locales, so we must validate first.
 */
function isValidLocale(locale: string): boolean {
  try {
    // Intl.DateTimeFormat throws RangeError for structurally invalid locale tags
    Intl.DateTimeFormat(locale);
    return true;
  } catch {
    return false;
  }
}

export interface DateFormatOptions {
  locale?: string;
  tz?: string;
}

export class DateService {
  format(
    date: Date | string | number,
    formatStr: string,
    options: DateFormatOptions = {},
  ): Result<string, AppError> {
    const { locale = DEFAULT_DAYJS_LOCALE, tz = DEFAULT_REGIONAL_CONTEXT.timezone } = options;

    if (!isValidLocale(locale)) {
      return err(new AppError('regional.invalid_locale', `Invalid locale: ${locale}`));
    }

    if (!isValidTimezone(tz)) {
      return err(new AppError('regional.invalid_timezone', `Invalid timezone: ${tz}`));
    }

    try {
      const result = dayjs(date).tz(tz).locale(locale).format(formatStr);
      if (!result || result === 'Invalid Date') {
        return err(new AppError('regional.format_failed', `Failed to format date`));
      }
      return ok(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new AppError('regional.format_failed', message));
    }
  }

  toUTC(date: Date | string | number, tz: string): Result<Date, AppError> {
    if (!isValidTimezone(tz)) {
      return err(new AppError('regional.invalid_timezone', `Invalid timezone: ${tz}`));
    }

    try {
      const result = dayjs.tz(date, tz).utc().toDate();
      return ok(result);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new AppError('regional.utc_conversion_failed', message));
    }
  }
}
