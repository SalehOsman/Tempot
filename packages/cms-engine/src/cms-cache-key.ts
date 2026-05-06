import type { CmsTranslationIdentity } from './cms-engine.types.js';

export const CMS_OVERRIDE_CACHE_TTL_SECONDS = 1800;

export function cmsCacheKey(identity: CmsTranslationIdentity): string {
  return `cms:${identity.locale}:${identity.namespace}:${identity.key}`;
}
