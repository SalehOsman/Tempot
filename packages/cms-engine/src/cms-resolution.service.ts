import { AppError } from '@tempot/shared';
import type { AsyncResult } from '@tempot/shared';
import { err, ok } from 'neverthrow';
import { CMS_ENGINE_ERRORS } from './cms-engine.errors.js';
import type { CmsResolutionDeps } from './cms-engine.ports.js';
import type { CmsResolution, CmsTranslationIdentity } from './cms-engine.types.js';
import { cmsCacheKey, CMS_OVERRIDE_CACHE_TTL_SECONDS } from './cms-cache-key.js';
import { isDynamicCmsEnabled } from './cms-toggle.js';

export class CmsResolutionService {
  constructor(private readonly deps: CmsResolutionDeps) {}

  async resolve(identity: CmsTranslationIdentity): AsyncResult<CmsResolution> {
    if (!isDynamicCmsEnabled(this.deps.dynamicCmsEnabled)) return this.resolveStatic(identity);

    const cached = await this.deps.cache.get(cmsCacheKey(identity));
    if (cached.isErr()) return err(new AppError(CMS_ENGINE_ERRORS.CACHE_READ_FAILED));
    if (cached.value) return ok(toResolution(identity, cached.value, 'cache'));

    const override = await this.deps.store.findOverride(identity);
    if (override.isErr()) return err(new AppError(CMS_ENGINE_ERRORS.OVERRIDE_READ_FAILED));
    if (!override.value) return this.resolveStatic(identity);

    const written = await this.deps.cache.set(
      cmsCacheKey(identity),
      override.value.value,
      CMS_OVERRIDE_CACHE_TTL_SECONDS,
    );
    if (written.isErr()) return err(new AppError(CMS_ENGINE_ERRORS.CACHE_WRITE_FAILED));
    return ok(toResolution(identity, override.value.value, 'override'));
  }

  private async resolveStatic(identity: CmsTranslationIdentity): AsyncResult<CmsResolution> {
    const current = await this.deps.staticCatalog.findStatic(identity);
    if (current.isErr()) return err(new AppError(CMS_ENGINE_ERRORS.STATIC_READ_FAILED));
    if (current.value) return ok(toResolution(identity, current.value.value, 'static'));
    return this.resolveFallbackStatic(identity);
  }

  private async resolveFallbackStatic(
    identity: CmsTranslationIdentity,
  ): AsyncResult<CmsResolution> {
    if (!identity.fallbackLocale) return err(new AppError(CMS_ENGINE_ERRORS.MISSING_KEY));
    const fallback = await this.deps.staticCatalog.findStatic({
      ...identity,
      locale: identity.fallbackLocale,
    });
    if (fallback.isErr()) return err(new AppError(CMS_ENGINE_ERRORS.STATIC_READ_FAILED));
    if (!fallback.value) return err(new AppError(CMS_ENGINE_ERRORS.MISSING_KEY));
    return ok(toResolution(identity, fallback.value.value, 'fallback_static'));
  }
}

function toResolution(
  identity: CmsTranslationIdentity,
  value: string,
  source: CmsResolution['source'],
): CmsResolution {
  return {
    namespace: identity.namespace,
    key: identity.key,
    locale: identity.locale,
    value,
    source,
    messageKeys: [],
  };
}
