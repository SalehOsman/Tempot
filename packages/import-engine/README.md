# @tempot/import-engine

> Streaming CSV/Excel import with Zod validation and Event-Driven batch processing.

## Purpose

Handles large-scale data imports without blocking the bot:

- Streaming parser (row by row) — handles files with thousands of rows
- Zod schema validation per row — errors isolated, valid rows continue
- BullMQ queue for background processing
- Error report generation via `@tempot/document-engine`
- Template generation (`pnpm import:template {module}`) for user guidance
- Communicates via Event Bus — modules never import import-engine directly

Disabled by default. Enable with `TEMPOT_IMPORT=true`.

## Phase

Phase 4 — Advanced Engines

## Dependencies

| Package | Purpose |
|---------|---------|
| `csv-parse` 5.x | CSV streaming parser |
| `xlsx` (SheetJS) 0.18.x | Excel file reading |
| `zod` 3.x | Row validation |
| `@tempot/shared` | queue factory (BullMQ) |
| `@tempot/event-bus` | Receive file, emit batches and completion |
| `@tempot/document-engine` | Error report generation |
| `@tempot/storage-engine` | Uploaded file reading |
| `@tempot/logger` | Import progress logging |

## Event Flow

```typescript
// Module triggers import
await eventBus.emit('import.file.received', {
  fileId: attachmentId,
  schema: myZodSchema,         // validation schema per row
  batchSize: 50,
  userId,
  locale: 'ar',
});

// Module listens for batches
eventBus.on('import.batch.ready', async ({ rows, batchNumber }) => {
  await Promise.all(rows.map(row => myRepo.create(row)));
});

// Module listens for completion
eventBus.on('import.process.completed', async ({ totalRows, successCount, errorCount, errorFileUrl }) => {
  await notifier.send(userId, 'import.completed', { successCount, errorCount });
});
```

## Scripts

```bash
pnpm import:template invoices   # Generate empty Excel template for invoices module
```

## Status

⏳ **Not yet implemented** — Phase 4
