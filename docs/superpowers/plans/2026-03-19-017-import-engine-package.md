# Import Engine Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the foundational import-engine package for bulk data processing and validation (Excel/CSV) as per Tempot v11 Blueprint.

**Architecture:** A decoupled service that listens for `import.file.received` events, adds a job to a BullMQ `imports` queue, and uses a `StreamingParser` (via `exceljs` or `csv-parse`) to process files in chunks. Each row is validated against a module-provided `Zod` schema. Valid rows are emitted as `import.batch.ready` events, while invalid rows are collected to generate an error report via `document-engine`.

**Tech Stack:** TypeScript, exceljs (Streaming API), csv-parse, Zod, @tempot/shared (QueueFactory), @tempot/event-bus, @tempot/document-engine, @tempot/storage-engine.

---

### Task 1: Import Schema and Row Validation (FR-002)

**Files:**
- Create: `packages/import-engine/src/types/import.types.ts`
- Test: `packages/import-engine/tests/unit/import-validation.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { validateRow } from '../src/types/import.types';

describe('Import Row Validation', () => {
  it('should validate a row against a Zod schema', () => {
    const schema = z.object({ name: z.string(), age: z.number() });
    const result = validateRow({ name: 'Ali', age: 'invalid' }, schema);
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/import-engine/tests/unit/import-validation.test.ts`
Expected: FAIL (validateRow not defined)

- [ ] **Step 3: Write minimal implementation**

```typescript
import { z } from 'zod';

export interface ImportRowResult {
  success: boolean;
  data?: any;
  errors?: string[];
  originalRow: any;
}

export function validateRow(row: any, schema: z.ZodTypeAny): ImportRowResult {
  const result = schema.safeParse(row);
  return {
    success: result.success,
    data: result.success ? result.data : undefined,
    errors: !result.success ? result.error.errors.map(e => e.message) : undefined,
    originalRow: row
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test packages/import-engine/tests/unit/import-validation.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/import-engine/src/types/import.types.ts
git commit -m "feat(import-engine): implement Zod-based row validation (FR-002)"
```

---

### Task 2: Streaming File Parser (Excel/CSV) (FR-007)

**Files:**
- Create: `packages/import-engine/src/parsers/streaming.parser.ts`
- Test: `packages/import-engine/tests/unit/streaming-parser.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { StreamingParser } from '../src/parsers/streaming.parser';
import { Readable } from 'stream';

describe('StreamingParser', () => {
  it('should parse a CSV stream and emit rows', async () => {
    const stream = Readable.from(['name,age\nAli,25\nOmar,30']);
    const parser = new StreamingParser();
    const rows: any[] = [];
    await parser.parseCSV(stream, (row) => rows.push(row));
    expect(rows.length).toBe(2);
    expect(rows[0].name).toBe('Ali');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/import-engine/tests/unit/streaming-parser.test.ts`
Expected: FAIL (StreamingParser not defined)

- [ ] **Step 3: Write minimal implementation**

```typescript
import { parse } from 'csv-parse';
import ExcelJS from 'exceljs';
import { Readable } from 'stream';

export class StreamingParser {
  async parseCSV(stream: Readable, onRow: (row: any) => void): Promise<void> {
    const parser = stream.pipe(parse({ columns: true, skip_empty_lines: true }));
    for await (const record of parser) {
      onRow(record);
    }
  }

  async parseXLSX(stream: Readable, onRow: (row: any) => void): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.read(stream);
    const sheet = workbook.worksheets[0];
    const headers: string[] = [];
    
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        row.eachCell((cell) => headers.push(cell.value as string));
      } else {
        const data: any = {};
        row.eachCell((cell, colNumber) => {
          data[headers[colNumber - 1]] = cell.value;
        });
        onRow(data);
      }
    });
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test packages/import-engine/tests/unit/streaming-parser.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/import-engine/src/parsers/streaming.parser.ts
git commit -m "feat(import-engine): implement streaming parsers for CSV and XLSX (FR-007)"
```

---

### Task 3: Import Worker with Batching (FR-001, FR-004)

**Files:**
- Create: `packages/import-engine/src/workers/import.worker.ts`
- Test: `packages/import-engine/tests/integration/import-worker.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { ImportWorker } from '../src/workers/import.worker';

describe('ImportWorker', () => {
  it('should emit import.batch.ready for valid rows', async () => {
    const eventBus = { publish: vi.fn() };
    const parser = { parseCSV: vi.fn((s, cb) => cb({ name: 'Ali' })) };
    // ... test logic ...
  });
});
```

- [ ] **Step 2: Run minimal implementation**

```typescript
import { Worker } from 'bullmq';

export class ImportWorker {
  constructor(private eventBus: any, private parser: any, private storage: any, private redis: any) {
    new Worker('imports', this.process.bind(this), { connection: this.redis });
  }

  async process(job: any) {
    const { providerKey, moduleId, schema } = job.data;
    const validRows: any[] = [];
    const invalidRows: any[] = [];

    // Stream from storage-engine and parse
    const stream = await this.storage.download(providerKey);
    
    await this.parser.parseXLSX(stream, (row) => {
      const result = validateRow(row, schema);
      if (result.success) {
        validRows.push(result.data);
        if (validRows.length >= 50) {
          this.eventBus.publish('import.batch.ready', { moduleId, rows: [...validRows] });
          validRows.length = 0;
        }
      } else {
        invalidRows.push({ ...row, _errors: result.errors });
      }
    });

    // Final batch and error report
    if (validRows.length > 0) this.eventBus.publish('import.batch.ready', { moduleId, rows: validRows });
    if (invalidRows.length > 0) this.eventBus.publish('document.export.requested', { format: 'XLSX', data: invalidRows });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/import-engine/src/workers/import.worker.ts
git commit -m "feat(import-engine): implement async import worker with batching (FR-004)"
```

---

### Task 4: Import Request Listener (FR-003)

**Files:**
- Create: `packages/import-engine/src/index.ts`
- Test: `packages/import-engine/tests/integration/import-request.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { ImportEngine } from '../src/index';

describe('ImportEngine Request Listener', () => {
  it('should add a job to the queue when file is received via event-bus', async () => {
    const queue = { add: vi.fn() };
    const eventBus = { subscribe: vi.fn() };
    const engine = new ImportEngine(eventBus as any, queue as any);
    
    // Simulate event-bus call
    const handler = eventBus.subscribe.mock.calls[0][1];
    await handler({ fileUrl: 'f.xlsx', moduleId: 'm1' });
    
    expect(queue.add).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run minimal implementation**

```typescript
export class ImportEngine {
  constructor(private eventBus: any, private queue: any) {
    this.eventBus.subscribe('import.file.received', this.handleRequest.bind(this));
  }

  async handleRequest(event: any) {
    await this.queue.add('import', event);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/import-engine/src/index.ts
git commit -m "feat(import-engine): implement event-bus listener for import requests (FR-003)"
```
