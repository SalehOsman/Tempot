import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RegionalService } from '../../src/regional.service.js';
import { DateService } from '../../src/date.service.js';
import { FormatService } from '../../src/format.service.js';
import { DEFAULT_REGIONAL_CONTEXT } from '../../src/regional.types.js';

// Mock shared (sessionContext)
vi.mock('@tempot/shared', async () => {
  const actual = await vi.importActual<typeof import('@tempot/shared')>('@tempot/shared');
  return {
    ...actual,
    sessionContext: {
      getStore: vi.fn(),
    },
  };
});

import { sessionContext } from '@tempot/shared';

describe('RegionalService', () => {
  const dateService = new DateService();
  const formatService = new FormatService();

  beforeEach(() => {
    vi.mocked(sessionContext.getStore).mockReset();
  });

  describe('static mode', () => {
    it('should return default context when no session is available', () => {
      vi.mocked(sessionContext.getStore).mockReturnValue(undefined);
      const service = new RegionalService(dateService, formatService, 'static');
      const result = service.getContext();
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(DEFAULT_REGIONAL_CONTEXT);
      }
    });

    it('should return default context even when session has data (ignores session)', () => {
      vi.mocked(sessionContext.getStore).mockReturnValue({
        timezone: 'Asia/Riyadh',
        locale: 'ar-SA',
        currencyCode: 'SAR',
        countryCode: 'SA',
      });
      const service = new RegionalService(dateService, formatService, 'static');
      const result = service.getContext();
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(DEFAULT_REGIONAL_CONTEXT);
      }
    });
  });

  describe('dynamic mode', () => {
    it('should merge session data into context', () => {
      vi.mocked(sessionContext.getStore).mockReturnValue({
        timezone: 'Asia/Riyadh',
        locale: 'ar-SA',
        currencyCode: 'SAR',
        countryCode: 'SA',
      });
      const service = new RegionalService(dateService, formatService, 'dynamic');
      const result = service.getContext();
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.timezone).toBe('Asia/Riyadh');
        expect(result.value.locale).toBe('ar-SA');
        expect(result.value.currencyCode).toBe('SAR');
        expect(result.value.countryCode).toBe('SA');
      }
    });

    it('should fall back to defaults when getStore() returns undefined', () => {
      vi.mocked(sessionContext.getStore).mockReturnValue(undefined);
      const service = new RegionalService(dateService, formatService, 'dynamic');
      const result = service.getContext();
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(DEFAULT_REGIONAL_CONTEXT);
      }
    });

    it('should fall back field-by-field when session has partial data', () => {
      vi.mocked(sessionContext.getStore).mockReturnValue({
        timezone: 'Asia/Riyadh',
        // locale, currencyCode, countryCode not set
      });
      const service = new RegionalService(dateService, formatService, 'dynamic');
      const result = service.getContext();
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.timezone).toBe('Asia/Riyadh');
        expect(result.value.locale).toBe(DEFAULT_REGIONAL_CONTEXT.locale);
        expect(result.value.currencyCode).toBe(DEFAULT_REGIONAL_CONTEXT.currencyCode);
        expect(result.value.countryCode).toBe(DEFAULT_REGIONAL_CONTEXT.countryCode);
      }
    });
  });

  describe('composed services', () => {
    it('should expose date and format as public readonly properties', () => {
      const service = new RegionalService(dateService, formatService, 'static');
      expect(service.date).toBe(dateService);
      expect(service.format).toBe(formatService);
    });
  });
});
