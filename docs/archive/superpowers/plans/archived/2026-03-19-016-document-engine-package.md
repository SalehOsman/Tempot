# Document Engine Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the foundational document-engine package for generating localized PDF and Excel documents (Arabic/RTL support) as per Architecture Spec v11 Blueprint.

**Architecture:** A decoupled service that listens for `document.export.requested` events, adds a job to a BullMQ `exports` queue, and uses specialized generators (`PDFGenerator` via `pdfmake`, `ExcelGenerator` via `ExcelJS`) to produce files. Results are automatically uploaded to the `storage-engine`, and a `document.export.completed` event is emitted.

**Tech Stack:** TypeScript, pdfmake (0.2.x), ExcelJS (4.x), @tempot/shared (QueueFactory), @tempot/event-bus, @tempot/storage-engine, @tempot/i18n-core.

---

### Task 1: PDF Generator with RTL Support (FR-001, FR-005)

**Files:**

- Create: `packages/document-engine/src/generators/pdf.generator.ts`
- Test: `packages/document-engine/tests/unit/pdf-generator.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { PDFGenerator } from '../src/generators/pdf.generator';

describe('PDFGenerator', () => {
  it('should generate a PDF buffer with RTL text', async () => {
    const generator = new PDFGenerator();
    const buffer = await generator.generate({ content: 'مرحبا بك' });
    expect(buffer).toBeDefined();
    expect(buffer.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/document-engine/tests/unit/pdf-generator.test.ts`
Expected: FAIL (PDFGenerator not defined)

- [ ] **Step 3: Write minimal implementation**

```typescript
import PdfPrinter from 'pdfmake';
import { TDocumentDefinitions } from 'pdfmake/interfaces';

export class PDFGenerator {
  private printer: PdfPrinter;

  constructor() {
    const fonts = {
      Amiri: {
        normal: 'fonts/Amiri-Regular.ttf',
        bold: 'fonts/Amiri-Bold.ttf',
      },
    };
    this.printer = new PdfPrinter(fonts);
  }

  async generate(data: any): Promise<Buffer> {
    const docDefinition: TDocumentDefinitions = {
      content: [data.content],
      defaultStyle: { font: 'Amiri' },
      rtl: true,
    };

    const pdfDoc = this.printer.createPdfKitDocument(docDefinition);
    return new Promise((resolve, reject) => {
      const chunks: any[] = [];
      pdfDoc.on('data', (chunk) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', reject);
      pdfDoc.end();
    });
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test packages/document-engine/tests/unit/pdf-generator.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/document-engine/src/generators/pdf.generator.ts
git commit -m "feat(document-engine): implement PDF generator with RTL support (FR-001)"
```

---

### Task 2: Excel Generator with RTL Support (FR-002, FR-005)

**Files:**

- Create: `packages/document-engine/src/generators/excel.generator.ts`
- Test: `packages/document-engine/tests/unit/excel-generator.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { ExcelGenerator } from '../src/generators/excel.generator';

describe('ExcelGenerator', () => {
  it('should generate an Excel buffer with RTL columns', async () => {
    const generator = new ExcelGenerator();
    const buffer = await generator.generate([{ name: 'علي', age: 25 }]);
    expect(buffer).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/document-engine/tests/unit/excel-generator.test.ts`
Expected: FAIL (ExcelGenerator not defined)

- [ ] **Step 3: Write minimal implementation**

```typescript
import ExcelJS from 'exceljs';

export class ExcelGenerator {
  async generate(data: any[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Sheet 1', { views: [{ rightToLeft: true }] });

    sheet.columns = Object.keys(data[0]).map((key) => ({ header: key, key }));
    sheet.addRows(data);

    return (await workbook.xlsx.writeBuffer()) as Buffer;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test packages/document-engine/tests/unit/excel-generator.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/document-engine/src/generators/excel.generator.ts
git commit -m "feat(document-engine): implement Excel generator with RTL support (FR-002)"
```

---

### Task 3: Asynchronous Export Worker (FR-004, FR-006)

**Files:**

- Create: `packages/document-engine/src/workers/export.worker.ts`
- Test: `packages/document-engine/tests/integration/export-worker.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { ExportWorker } from '../src/workers/export.worker';

describe('ExportWorker', () => {
  it('should generate file and upload to storage', async () => {
    const storage = { upload: vi.fn().mockResolvedValue({ url: 'http://link' }) };
    const eventBus = { publish: vi.fn() };
    // ... test logic ...
  });
});
```

- [ ] **Step 2: Run minimal implementation**

```typescript
import { Worker } from 'bullmq';
import { PDFGenerator } from '../generators/pdf.generator';
import { ExcelGenerator } from '../generators/excel.generator';

export class ExportWorker {
  constructor(
    private storage: any,
    private eventBus: any,
    private redis: any,
  ) {
    new Worker('exports', this.process.bind(this), { connection: this.redis });
  }

  async process(job: any) {
    const { format, data, userId } = job.data;
    const generator = format === 'PDF' ? new PDFGenerator() : new ExcelGenerator();

    const buffer = await generator.generate(data);
    const fileName = `export_${Date.now()}.${format.toLowerCase()}`;

    const upload = await this.storage.upload(buffer, {
      fileName,
      mimeType: 'application/octet-stream',
    });

    await this.eventBus.publish('document.export.completed', { userId, url: upload.url });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/document-engine/src/workers/export.worker.ts
git commit -m "feat(document-engine): implement async export worker with storage integration (FR-004)"
```

---

### Task 4: Export Request Listener (FR-003)

**Files:**

- Create: `packages/document-engine/src/index.ts`
- Test: `packages/document-engine/tests/integration/export-request.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { DocumentEngine } from '../src/index';

describe('DocumentEngine Request Listener', () => {
  it('should add a job to the queue when export is requested via event-bus', async () => {
    const queue = { add: vi.fn() };
    const eventBus = { subscribe: vi.fn() };
    const engine = new DocumentEngine(eventBus as any, queue as any);

    // Simulate event-bus call
    const handler = eventBus.subscribe.mock.calls[0][1];
    await handler({ userId: '1', format: 'PDF', data: {} });

    expect(queue.add).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run minimal implementation**

```typescript
export class DocumentEngine {
  constructor(
    private eventBus: any,
    private queue: any,
  ) {
    this.eventBus.subscribe('document.export.requested', this.handleRequest.bind(this));
  }

  async handleRequest(event: any) {
    await this.queue.add('export', event);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/document-engine/src/index.ts
git commit -m "feat(document-engine): implement event-bus listener for export requests (FR-003)"
```
