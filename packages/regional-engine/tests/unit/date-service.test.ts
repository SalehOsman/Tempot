import { describe, it, expect } from 'vitest';
import { DateService } from '../../src/date.service.js';

describe('DateService', () => {
  const service = new DateService();

  describe('format()', () => {
    it('should format UTC date to Cairo local time in Arabic', () => {
      const date = new Date('2025-03-15T12:00:00Z');
      const result = service.format(date, 'LL', { locale: 'ar', tz: 'Africa/Cairo' });
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        // dayjs ar locale uses Arabic month names with Western digits
        expect(result.value).toContain('\u0645\u0627\u0631\u0633');
        expect(result.value).toContain('2025');
      }
    });

    it('should format date for Riyadh timezone', () => {
      const date = new Date('2025-03-15T12:00:00Z');
      const result = service.format(date, 'LL', { locale: 'ar', tz: 'Asia/Riyadh' });
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toContain('2025');
        expect(result.value).toContain('\u0645\u0627\u0631\u0633');
      }
    });

    it('should use default timezone and locale when not specified', () => {
      const date = new Date('2025-03-15T12:00:00Z');
      const result = service.format(date, 'YYYY-MM-DD');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        // Default is Africa/Cairo (UTC+2), so 12:00 UTC = 14:00 Cairo, same day
        expect(result.value).toContain('2025');
      }
    });

    it('should return err for invalid timezone', () => {
      const date = new Date('2025-03-15T12:00:00Z');
      const result = service.format(date, 'LL', { locale: 'ar', tz: 'Invalid/Timezone' });
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe('regional.invalid_timezone');
      }
    });
  });

  describe('toUTC()', () => {
    it('should convert local time to UTC Date', () => {
      const result = service.toUTC('2025-03-15 14:30', 'Africa/Cairo');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeInstanceOf(Date);
        // Cairo is UTC+2, so 14:30 Cairo = 12:30 UTC
        expect(result.value.getUTCHours()).toBe(12);
        expect(result.value.getUTCMinutes()).toBe(30);
      }
    });

    it('should handle Riyadh timezone (UTC+3)', () => {
      const result = service.toUTC('2025-03-15 15:30', 'Asia/Riyadh');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeInstanceOf(Date);
        // Riyadh is UTC+3, so 15:30 Riyadh = 12:30 UTC
        expect(result.value.getUTCHours()).toBe(12);
        expect(result.value.getUTCMinutes()).toBe(30);
      }
    });
  });
});
