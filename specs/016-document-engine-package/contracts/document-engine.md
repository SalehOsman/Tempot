# Contract: Document Engine Package

## Events

### `document.export.requested`

Starts an export workflow. The payload contains export identity, actor, module,
template, locale, format, and template payload.

### `document.export.completed`

Emitted after generation and storage upload succeed. The payload contains export identity,
storage metadata, and content metadata.

### `document.export.failed`

Emitted after generation, queue processing, or storage upload fails. The payload contains
export identity, typed error code, message key, and retryability.

## Boundary Rules

- Modules communicate through events, not direct workflow imports.
- Queue processing uses shared queue abstractions.
- Storage upload uses injected storage adapters.
- User-facing status metadata uses i18n keys.
