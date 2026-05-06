# Research: Import Engine Package

**Feature**: 017-import-engine-package
**Repaired**: 2026-05-06

## Key Decisions

### D1: Start after `document-engine`

Invalid-row reports depend on document export contracts. The import package should not
start until those contracts are available.

### D2: Destination modules own persistence

`import-engine` parses, validates, batches, and emits events. Destination modules decide
how to insert, update, reject duplicates, and audit domain-specific changes.

### D3: Use injected schema adapters

The package should not hardwire one validation schema type into all public contracts. An
adapter interface lets modules provide deterministic validation while preserving strict
types.

### D4: Keep template CLI out of the MVP

The old forward design included a template command. That is useful, but it is a DX feature
and should be specified separately so the package MVP stays focused.

### D5: Use deterministic in-package CSV and XLSX readers for the MVP

The implementation branch verified current parser candidates before manifest edits.
`csv-parse` and `fast-csv` satisfy the dependency rule, but the spreadsheet candidates
`xlsx` and `exceljs` do not satisfy the required six-month repository push activity.
`zod` is already present in the workspace and satisfies the dependency rule, but the
package design intentionally uses an injected schema adapter instead of coupling every
consumer to one validation library. The MVP therefore adds no parser runtime dependency
and implements deterministic CSV and stored-XLSX worksheet readers inside the package.

## Alternatives Rejected

### Direct database writes from `import-engine`

Rejected because modules own domain persistence and duplicate/upsert behavior.

### Loading full import files into memory

Rejected because large import files must be processed incrementally.

### Generating error reports internally

Rejected because `document-engine` owns document export behavior.

### Adding SheetJS `xlsx` during MVP implementation

Rejected because current repository push activity did not satisfy the project dependency
rule during implementation verification.

### Coupling validation directly to Zod

Rejected because Spec #017 requires injected schema adapters so modules can own their
validation library and versioning choices.

## Dependency Notes

Dependency verification completed in the implementation branch. The MVP package manifest
does not add parser, validation, or direct document-engine runtime dependencies beyond
`@tempot/shared` and `neverthrow`; document report integration remains a port contract.
