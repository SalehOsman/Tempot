# Research: Document Engine Package

**Feature**: 016-document-engine-package
**Repaired**: 2026-05-06

## Key Decisions

### D1: Implement `document-engine` before `import-engine`

`import-engine` needs error report generation. Building document export contracts first
reduces cross-package uncertainty.

### D2: Use event contracts and adapters

Modules request exports through event-bus contracts. The package uses injected queue,
storage, and event adapters so tests remain deterministic.

### D3: Keep generator APIs buffer-oriented

Generators return buffers plus metadata. Storage upload remains a separate step so
failure handling can distinguish generation failures from upload failures.

### D4: Dependency choice must be verified during implementation

Existing forward design referenced PDF and spreadsheet libraries. The implementation
branch must verify the current lockfile, package compatibility, TypeScript types, and RTL
behavior before editing manifests.

### D5: Use deterministic in-package PDF and XLSX writers for the MVP

The implementation branch verified that no PDF or spreadsheet generator is currently
locked. `pdfkit` satisfies current activity requirements, but the spreadsheet candidate
`exceljs` did not show repository push activity within the required six-month window at
the time of verification. The MVP will therefore avoid new document-generation runtime
dependencies and provide small deterministic writers for valid PDF and XLSX buffers.
This keeps the package inside the dependency rule while preserving the adapter boundary
so a future dependency can be adopted through ADR-backed review.

## Alternatives Rejected

### Inline export generation in bot handlers

Rejected because large exports must not block request handling.

### Direct storage or event-bus singletons

Rejected because injected adapters are easier to test and preserve package boundaries.

### Throwing errors from public workflow APIs

Rejected because package public failure paths must return Result values and emit typed
failure events.

### Adding ExcelJS during MVP implementation

Rejected for the MVP because current repository activity verification did not satisfy the
project dependency rule. Spreadsheet generation remains an adapter boundary.

## Dependency Notes

Dependency verification completed in the implementation branch. The MVP package manifest
does not add document-generation runtime dependencies.
