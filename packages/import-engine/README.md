# @tempot/import-engine

Asynchronous import workflow package for Tempot. It receives import requests,
queues processing through injected queue ports, reads uploaded files through a
storage adapter, parses CSV or spreadsheet rows, validates rows through an
injected schema adapter, emits valid batches, requests spreadsheet error reports
for invalid rows, and publishes completion or failure events.

## Status

Active implementation package. It follows the shared package toggle convention:
enabled by default and disabled with `TEMPOT_IMPORT_ENGINE=false`.

## Scope

Implemented now:

- Strict import request, job, row, batch, summary, and failure contracts
- Deterministic CSV parsing with quoted field support
- Deterministic XLSX worksheet parsing for stored ZIP spreadsheet fixtures
- Injected schema adapter validation
- Queue request handling through an injected queue port
- Valid batch events through an injected event publisher
- Invalid-row spreadsheet report requests through the `document-engine` contract
- Completion and failure lifecycle events

Deferred:

- Root CLI or template-generation commands
- Direct Zod coupling
- Direct database writes or duplicate/upsert handling
- External spreadsheet parser adoption
- Direct bot UI or Telegram notifications

## Architecture

```text
Module/App
  -> import.file.received event
    -> ImportRequestHandler
      -> ImportQueue
        -> ImportProcessor
          -> ImportStoragePort
          -> ImportParser
          -> ImportSchemaAdapter
          -> ImportEventPublisher
          -> ImportDocumentReportRequester
```

Destination modules own persistence and duplicate handling. `import-engine`
communicates through events and ports only.

## Public API

```typescript
import {
  ImportProcessor,
  ImportRequestHandler,
  ImportQueue,
  CsvImportParser,
  SpreadsheetImportParser,
} from '@tempot/import-engine';

const handler = new ImportRequestHandler({ queue });

await handler.handle({
  importId: 'import-1',
  requestedBy: 'user-1',
  moduleId: 'contacts',
  fileKey: 'uploads/import-1.csv',
  format: 'csv',
  locale: 'en',
  batchSize: 50,
  schemaKey: 'contacts.v1',
});

const processor = new ImportProcessor({
  parsers: {
    csv: new CsvImportParser(),
    spreadsheet: new SpreadsheetImportParser(),
  },
  storage,
  schema,
  events,
  documents,
});
```

## Events

- `import.file.received`
- `import.batch.ready`
- `import.process.completed`
- `import.process.failed`

## Error Codes

- `import_engine.parse_failed`
- `import_engine.validation_failed`
- `import_engine.unsupported_format`
- `import_engine.storage_read_failed`
- `import_engine.queue_enqueue_failed`
- `import_engine.event_publish_failed`
- `import_engine.document_report_failed`

## Validation

```bash
pnpm --filter @tempot/import-engine test
pnpm --filter @tempot/import-engine build
pnpm lint
pnpm spec:validate
pnpm boundary:audit
pnpm module:checklist
```
