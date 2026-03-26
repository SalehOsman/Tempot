import { ok, type Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { sessionContext } from '@tempot/session-manager';
import { DateService } from './date.service.js';
import { FormatService } from './format.service.js';
import type { RegionalContext } from './types.js';
import { DEFAULT_REGIONAL_CONTEXT } from './types.js';

type RegionalMode = 'static' | 'dynamic';

export class RegionalService {
  constructor(
    public readonly date: DateService,
    public readonly format: FormatService,
    private readonly mode: RegionalMode = 'static',
  ) {}

  getContext(): Result<RegionalContext, AppError> {
    if (this.mode === 'static') {
      return ok({ ...DEFAULT_REGIONAL_CONTEXT });
    }

    // Dynamic mode: resolve from session, fall back to defaults
    const store = sessionContext.getStore();
    if (!store) {
      return ok({ ...DEFAULT_REGIONAL_CONTEXT });
    }

    const context: RegionalContext = {
      timezone: (store.timezone as string | undefined) ?? DEFAULT_REGIONAL_CONTEXT.timezone,
      locale: (store.locale as string | undefined) ?? DEFAULT_REGIONAL_CONTEXT.locale,
      currencyCode:
        (store.currencyCode as string | undefined) ?? DEFAULT_REGIONAL_CONTEXT.currencyCode,
      countryCode:
        (store.countryCode as string | undefined) ?? DEFAULT_REGIONAL_CONTEXT.countryCode,
    };

    return ok(context);
  }
}
