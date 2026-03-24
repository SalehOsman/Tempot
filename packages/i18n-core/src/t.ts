import i18next, { TOptions } from 'i18next';
import { sessionContext } from '@tempot/session-manager';

export function t(key: string | string[], options?: TOptions): string {
  const store = sessionContext.getStore();
  const lang = store?.lang || 'ar';

  return i18next.t(key, { ...options, lng: lang }) as string;
}
