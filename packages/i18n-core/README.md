# @tempot/i18n-core

Core i18n package for Tempot. Configures i18next with Arabic as the primary language, provides context-aware translation, locale validation, and zero-hardcoding enforcement.

## Exports

| Export                             | Module           | Description                                                                            |
| ---------------------------------- | ---------------- | -------------------------------------------------------------------------------------- |
| `i18nConfig`                       | `i18n.config.ts` | i18next init options (`lng: 'ar'`, `fallbackLng: 'en'`)                                |
| `t(key, options?)`                 | `t.ts`           | Context-aware translation via `sessionContext`                                         |
| `TranslationOptions`               | `t.ts`           | Options type for `t()` (count, defaultValue, context, interpolation)                   |
| `loadModuleLocales()`              | `loader.ts`      | Glob-loads `modules/*/locales/*.json` into i18next                                     |
| `getLocaleInfo(lang)`              | `locale-info.ts` | Returns `{ lang, dir }` — `'rtl'` for Arabic, `'ltr'` otherwise                        |
| `sanitizeValue(value)`             | `sanitizer.ts`   | Strips unsafe HTML, allows `<b>`, `<i>`, `<em>`, `<strong>`, `<a>`, `<p>`, `<br>`      |
| `LocaleSchema`                     | `schema.ts`      | Zod schema validating locale JSON (recursive string records)                           |
| `LocaleFile`                       | `schema.ts`      | TypeScript type inferred from `LocaleSchema`                                           |
| `validateLocaleFile(data)`         | `schema.ts`      | Validates unknown data against `LocaleSchema` — returns `Result<LocaleFile, AppError>` |
| `generateSchemaFromSource(source)` | `schema.ts`      | Builds a strict Zod schema from a source locale for parity checks                      |

## Usage

### Initialise i18next

```typescript
import i18next from 'i18next';
import { i18nConfig, loadModuleLocales } from '@tempot/i18n-core';

await i18next.init(i18nConfig);

const result = await loadModuleLocales();
if (result.isErr()) {
  console.error(result.error); // AppError with code i18n.locale_load_failed
}
```

### Translate

```typescript
import { t } from '@tempot/i18n-core';

// Reads language from sessionContext (AsyncLocalStorage).
// Falls back to 'ar' when no session is active.
const greeting = t('common.greeting', { name: 'Ahmed' });

// Pluralisation
const count = t('invoices.count', { count: 5 });

// Multiple keys (first match wins)
const msg = t(['custom.key', 'fallback.key']);
```

### Validate locale files

```typescript
import { validateLocaleFile, generateSchemaFromSource } from '@tempot/i18n-core';

// Validate structure
const result = validateLocaleFile(jsonData);
if (result.isErr()) {
  console.error(result.error); // AppError with code i18n.schema_validation_failed
}

// Parity check: ensure en.json has the same keys as ar.json
const schema = generateSchemaFromSource(arJson);
const parsed = schema.safeParse(enJson); // fails on missing/extra keys
```

## Module locale convention

```
modules/{moduleName}/locales/
  ar.json   # Arabic — source of truth
  en.json   # English — must match ar.json key structure
```

`loadModuleLocales()` registers each file as an i18next resource bundle where `moduleName` becomes the namespace and the filename (without `.json`) becomes the language code.

## Scripts

| Script           | Description                                           |
| ---------------- | ----------------------------------------------------- |
| `pnpm build`     | Compiles TypeScript to `dist/`                        |
| `pnpm test`      | Runs Vitest test suite                                |
| `pnpm cms:check` | Detects hardcoded strings and validates locale parity |

`cms:check` is also wired into the Husky pre-commit hook via the root `package.json`.

## Dependencies

| Package                   | Purpose                                  |
| ------------------------- | ---------------------------------------- |
| `i18next`                 | Internationalisation framework           |
| `neverthrow`              | Result type for error handling           |
| `zod`                     | Locale file schema validation            |
| `sanitize-html`           | HTML sanitisation for translation values |
| `glob`                    | File pattern matching for locale loader  |
| `@tempot/session-manager` | User language from session context       |

## Rules

- Zero hardcoded user-facing text in `.ts` files (Constitution Rule XXXIX)
- Arabic is the primary language; English is the fallback
- Every module must provide both `ar.json` and `en.json`
- All public functions return `Result<T, AppError>` where failure is possible
