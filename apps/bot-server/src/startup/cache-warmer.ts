import { ok } from 'neverthrow';
import type { AsyncResult } from '@tempot/shared';
import type { ModuleLogger } from '../bot-server.types.js';

interface CacheWarmerDeps {
  settingsWarmer: { warmAll: () => Promise<void> };
  i18nWarmer: { warmAll: () => Promise<void> };
  logger: ModuleLogger;
}

export async function warmCaches(deps: CacheWarmerDeps): AsyncResult<void> {
  try {
    await deps.settingsWarmer.warmAll();
  } catch (error: unknown) {
    deps.logger.warn({
      msg: 'Settings cache warming failed',
      error: error instanceof Error ? error.message : String(error),
    });
  }

  try {
    await deps.i18nWarmer.warmAll();
  } catch (error: unknown) {
    deps.logger.warn({
      msg: 'Translation cache warming failed',
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return ok(undefined);
}
