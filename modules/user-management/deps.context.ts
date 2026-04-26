/**
 * Module Deps Context
 *
 * يحتفظ بـ deps المُمرَّرة من bot-server ويتيحها لكل جزء من الموديول
 * بدلاً من تمريرها يدوياً في كل دالة أو استيراد logger مباشرة.
 *
 * يُستدعى register() مرة واحدة فقط في setup() ثم يُقرأ في كل مكان.
 */

import type { ModuleDeps } from './types/module-deps.types.js';

let _deps: ModuleDeps | null = null;

export function registerDeps(deps: ModuleDeps): void {
  _deps = deps;
}

export function getDeps(): ModuleDeps {
  if (!_deps) {
    throw new Error('[user-management] getDeps() called before registerDeps()');
  }
  return _deps;
}

export function getLogger(): ModuleDeps['logger'] {
  return getDeps().logger;
}

export function getI18n(): ModuleDeps['i18n'] {
  return getDeps().i18n;
}
