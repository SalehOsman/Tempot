# Contract: Import Engine Package

## Events

### `import.file.received`

Starts an import workflow. The payload contains import identity, actor, module, file
reference, format, locale, batch size, and validation schema key.

### `import.batch.ready`

Emitted for valid rows. Destination modules consume this event and own persistence.

### `import.process.completed`

Emitted after processing finishes. The payload contains row totals, final status, and
optional error report metadata.

### `import.process.failed`

Emitted when parsing, validation setup, storage download, or queue processing fails.

## Boundary Rules

- The package does not write module data directly.
- The package requests error reports through `document-engine` contracts.
- The package reads uploaded files through storage adapters.
- User-facing status metadata uses i18n keys.
