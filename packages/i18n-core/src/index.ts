export { i18nConfig, DEFAULT_LANGUAGE, FALLBACK_LANGUAGE } from './i18n.config.js';
export { loadModuleLocales } from './i18n.loader.js';
export { t } from './i18n.translator.js';
export type { TranslationOptions } from './i18n.translator.js';
export { getLocaleInfo } from './i18n.locale-info.js';
export { sanitizeValue } from './i18n.sanitizer.js';
export { LocaleSchema, validateLocaleFile, generateSchemaFromSource } from './i18n.schema.js';
export type { LocaleFile } from './i18n.schema.js';
