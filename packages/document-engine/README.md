# @tempot/document-engine

> Async PDF and Excel generation via BullMQ. Communicates exclusively via Event Bus.

## Purpose

Generates PDF and Excel documents asynchronously:

- PDF via `pdfmake` with full RTL + Arabic font support
- Excel via `ExcelJS` with RTL worksheet settings
- Communicates via Event Bus only — modules never import document-engine directly
- File upload to `@tempot/storage-engine` after generation
- CASL permission check before generating

Disabled by default. Enable with `TEMPOT_DOCUMENTS=true`.

## Phase

Phase 4 — Advanced Engines

## Dependencies

| Package                  | Purpose                           |
| ------------------------ | --------------------------------- |
| `pdfmake` 0.2.x          | PDF generation with RTL — ADR-009 |
| `ExcelJS` 4.x            | Excel generation with RTL         |
| `@tempot/shared`         | queue factory (BullMQ)            |
| `@tempot/storage-engine` | Upload generated files            |
| `@tempot/event-bus`      | Receive requests, emit completion |
| `@tempot/auth-core`      | CASL permission check             |
| `@tempot/i18n-core`      | Document headers and labels       |

## Event Flow (never import directly)

```typescript
// In a module — emit request
await eventBus.emit('document.export.requested', {
  type: 'pdf', // 'pdf' | 'excel'
  moduleId: 'invoices',
  templateId: 'invoice-report',
  data: { invoices, dateRange },
  requestedBy: userId,
  locale: 'ar',
});

// document-engine listens, generates, uploads, emits result
// Listen for completion in your module
eventBus.on('document.export.completed', async ({ fileUrl, requestedBy }) => {
  await notifier.send(requestedBy, 'document.ready', { url: fileUrl });
});
```

## ADRs

- ADR-009 — pdfmake for PDF generation

## Status

⏳ **Not yet implemented** — Phase 4
