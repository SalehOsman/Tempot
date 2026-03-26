import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import localizedFormat from 'dayjs/plugin/localizedFormat.js';
import 'dayjs/locale/ar.js';
import { ok, err, type Result } from 'neverthrow';
import { AppError } from '@tempot/shared';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(localizedFormat);

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
    const { locale = 'ar', tz = 'Africa/Cairo' } = options;

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
