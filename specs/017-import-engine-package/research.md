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

## Alternatives Rejected

### Direct database writes from `import-engine`

Rejected because modules own domain persistence and duplicate/upsert behavior.

### Loading full import files into memory

Rejected because large import files must be processed incrementally.

### Generating error reports internally

Rejected because `document-engine` owns document export behavior.

## Dependency Notes

The implementation branch must verify parser dependencies against the current lockfile,
TypeScript types, streaming behavior, and package licensing before manifest changes.
