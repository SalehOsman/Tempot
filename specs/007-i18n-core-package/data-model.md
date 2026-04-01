# Data Model: i18n Core

## Types & Interfaces

### `TranslationOptions`

Options passed to the `t()` translation function.

| Field           | Type      | Description                             | Constraints               |
| --------------- | --------- | --------------------------------------- | ------------------------- |
| `count`         | `number`  | Pluralization count                     | Optional                  |
| `defaultValue`  | `string`  | Fallback value if key is not found      | Optional                  |
| `context`       | `string`  | Context suffix for gender/mode variants | Optional                  |
| `[key: string]` | `unknown` | Additional interpolation variables      | Optional, index signature |

### `LocaleValue`

Recursive type representing locale file structure.

```typescript
type LocaleValue = string | { [key: string]: LocaleValue };
```

Leaf values must be strings; intermediate nodes are nested objects.

### `LocaleFile`

Inferred from `LocaleSchema` (Zod). Represents a validated locale JSON file — a `Record<string, LocaleValue>` with at least one key.

### `CmsCheckViolation`

Represents a violation found by the `cms:check` script.

| Field     | Type                                                       | Description                         | Constraints |
| --------- | ---------------------------------------------------------- | ----------------------------------- | ----------- |
| `file`    | `string`                                                   | File path where violation was found | Required    |
| `line`    | `number`                                                   | Line number of the violation        | Optional    |
| `type`    | `'hardcoded-string' \| 'locale-parity' \| 'locale-schema'` | Category of violation               | Required    |
| `message` | `string`                                                   | Human-readable description          | Required    |

### `CmsCheckResult`

Result of running all `cms:check` validations.

| Field        | Type                  | Description                              | Constraints |
| ------------ | --------------------- | ---------------------------------------- | ----------- |
| `violations` | `CmsCheckViolation[]` | All violations found                     | Required    |
| `passed`     | `boolean`             | Whether the check passed (no violations) | Required    |

## Schemas

### `LocaleSchema` (Zod)

Validates locale JSON files. Accepts flat (`{ "key": "value" }`) or nested (`{ "namespace": { "key": "value" } }`) structures. All leaf values must be strings. The object must have at least one key.

### `generateSchemaFromSource(source)`

Generates a strict Zod schema from a source locale (e.g., `ar.json`). The returned schema enforces that the target locale has exactly the same key structure — no missing keys, no extra keys.

## Error Codes

| Code                            | Module        | Trigger                                             |
| ------------------------------- | ------------- | --------------------------------------------------- |
| `i18n.locale_load_failed`       | `i18n.loader` | File read or JSON parse error during locale loading |
| `i18n.schema_validation_failed` | `i18n.schema` | Locale file fails Zod schema validation             |
| `i18n.locale_parity_failed`     | `cms-check`   | Target locale has missing or extra keys vs source   |

## Constants

| Constant            | Source                             | Default | Description                                           |
| ------------------- | ---------------------------------- | ------- | ----------------------------------------------------- |
| `DEFAULT_LANGUAGE`  | `TEMPOT_DEFAULT_LANGUAGE` env var  | `'ar'`  | Primary language for all interfaces                   |
| `FALLBACK_LANGUAGE` | `TEMPOT_FALLBACK_LANGUAGE` env var | `'en'`  | Fallback language when primary translation is missing |

## Locale File Convention

Translation files follow the path convention: `modules/{moduleName}/locales/{lang}.json`

- `moduleName` becomes the i18next namespace
- `lang` (filename without `.json`) becomes the language code
- Example: `modules/auth/locales/ar.json` → namespace `auth`, language `ar`

## Sanitization Rules

Translation values are sanitized via `sanitize-html` before rendering. Allowed HTML tags:

| Allowed Tags                                           | Allowed Attributes   |
| ------------------------------------------------------ | -------------------- |
| `<b>`, `<i>`, `<em>`, `<strong>`, `<a>`, `<p>`, `<br>` | `href` on `<a>` only |

All other tags (including `<script>`) are stripped.

## Text Directionality

The `getLocaleInfo(lang)` helper returns `{ lang, dir }` where:

- `dir = 'rtl'` for Arabic (`ar`)
- `dir = 'ltr'` for all other languages
