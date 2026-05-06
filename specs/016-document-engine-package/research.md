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

## Alternatives Rejected

### Inline export generation in bot handlers

Rejected because large exports must not block request handling.

### Direct storage or event-bus singletons

Rejected because injected adapters are easier to test and preserve package boundaries.

### Throwing errors from public workflow APIs

Rejected because package public failure paths must return Result values and emit typed
failure events.

## Dependency Notes

Potential document-generation dependencies must be researched in the implementation
branch. The activation slice does not add dependencies.
