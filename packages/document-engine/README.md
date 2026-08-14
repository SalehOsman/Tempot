# @tempot/document-engine

Document export package for Tempot. It accepts event-driven export requests, queues
document jobs through injected ports, generates PDF or spreadsheet buffers, uploads
files through a storage adapter, and publishes completion or failure events.

## Status

Active implementation package. It follows the shared package toggle convention:
enabled by default and disabled with `TEMPOT_DOCUMENT_ENGINE=false`.

## Scope

Implemented now:

- PDF export contract and deterministic PDF buffer generation
- Spreadsheet export contract and deterministic XLSX buffer generation
- RTL layout metadata for Arabic-oriented templates
- Queue request handling through an injected queue port
- Storage upload through an injected storage port
- Completion and failure event publishing through an injected event port

Deferred:

- Rich document layout templates
- External PDF or spreadsheet rendering libraries
- Long-term export history database tables
- Direct Telegram file delivery

## Architecture

The package is intentionally port-based:

```text
Module/App
  -> document.export.requested event
    -> DocumentExportRequestHandler
      -> DocumentExportQueue
        -> DocumentExportProcessor
          -> DocumentGenerator
          -> DocumentStoragePort
          -> DocumentEventPublisher
```

The package does not own storage, event bus, Redis, or worker lifecycle. Application
composition injects those adapters.

## Public API

```typescript
import {
  DocumentExportProcessor,
  DocumentExportRequestHandler,
  createDefaultDocumentGenerators,
} from '@tempot/document-engine';

const generators = createDefaultDocumentGenerators();
const handler = new DocumentExportRequestHandler({ queue });

await handler.handle({
  exportId: 'export-1',
  requestedBy: 'user-1',
  moduleId: 'reports',
  format: 'pdf',
  templateId: 'report.summary',
  locale: 'ar-EG',
  payload: { rows: [] },
});

const processor = new DocumentExportProcessor({
  generators,
  storage,
  events,
});
```

## Events

- `document.export.requested`
- `document.export.completed`
- `document.export.failed`

## Error Codes

- `document_engine.unsupported_format`
- `document_engine.generation_failed`
- `document_engine.storage_upload_failed`
- `document_engine.queue_enqueue_failed`
- `document_engine.event_publish_failed`

## Validation

```bash
pnpm --filter @tempot/document-engine test
pnpm --filter @tempot/document-engine build
pnpm lint
pnpm spec:validate
pnpm boundary:audit
pnpm module:checklist
```
