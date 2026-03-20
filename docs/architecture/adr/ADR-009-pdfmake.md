# ADR-009: pdfmake for PDF Generation

**Date:** 2026-03-19
**Status:** Accepted (resolved from v10 — previously undecided)

## Context

Tempot's document-engine requires PDF generation with RTL (right-to-left) support for Arabic content, complex layouts (tables, headers, footers), and async generation via BullMQ.

## Decision

Use **pdfmake v0.2.x** for PDF generation.

## Consequences

- Full RTL support for Arabic text and layouts
- JSON-based document definition (no HTML templating)
- Runs in Node.js without headless browser dependency
- Async-friendly — integrates cleanly with BullMQ queue factory
- Custom fonts supported (required for Arabic typography)

## Alternatives Rejected

**pdf-lib:** Low-level API, no RTL support, requires manual layout calculation for every element.

**Puppeteer/Playwright (HTML to PDF):** Heavy dependency (100MB+ Chromium), slow startup, excessive for server-side PDF generation.

**jsPDF:** Browser-focused, limited RTL support, less suited for complex server-side documents.
