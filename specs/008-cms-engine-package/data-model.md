# CMS Engine Data Model

## TranslationKey

Represents a static key discovered from JSON.

- `namespace`: module or shared namespace.
- `key`: translation key inside the namespace.
- `locale`: requested locale.
- `fallbackLocale`: fallback locale for static resolution.
- `value`: static source value.
- `format`: `plain`, `telegram_html`, or `markdown`.
- `protection`: `editable`, `requires_review`, `super_admin_only`, or `locked`.

## TranslationOverride

Represents a dynamic override value.

- `namespace`: module or shared namespace.
- `key`: translation key.
- `locale`: override locale.
- `value`: sanitized override value.
- `previousValue`: previous override value when available.
- `updatedBy`: administrator or service actor id.
- `updatedAt`: ISO timestamp.
- `protection`: policy applied at write time.

## TranslationRevision

Immutable history entry for audit and rollback.

- `namespace`
- `key`
- `locale`
- `beforeValue`
- `afterValue`
- `changedBy`
- `changedAt`
- `reason`

## CmsResolution

Runtime translation lookup result.

- `namespace`
- `key`
- `locale`
- `value`
- `source`: `cache`, `override`, `static`, or `fallback_static`
- `messageKeys`: i18n keys for missing or disabled-state flows.

## CmsAiReviewRequest

AI draft-review input. It is never used by runtime lookup.

- `namespace`
- `key`
- `locale`
- `fallbackLocale`
- `sourceValue`
- `draftValue`
- `format`
- `protection`
- `context`

## CmsAiReviewReport

AI draft-review output.

- `status`: `approved`, `changes_requested`, or `blocked`
- `suggestions`: draft-only suggested replacements.
- `riskFlags`: policy, tone, legal, security, or placeholder risks.
- `placeholderFindings`: missing or extra placeholder names.
- `messageKeys`: i18n keys suitable for dashboard rendering.

## Event Payload

`cms.translation.updated`

- `namespace`
- `key`
- `locale`
- `updatedBy`
- `updatedAt`

## State Rules

- Dashboard/admin flows cannot create or delete keys.
- Static JSON remains the structural source of truth for key existence.
- Overrides store values only for keys that exist in static JSON.
- AI reports do not mutate translation state.
