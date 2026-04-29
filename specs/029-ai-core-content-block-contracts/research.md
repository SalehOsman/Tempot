# Research: AI Core Content Block Contracts

**Feature**: 029-ai-core-content-block-contracts
**Date**: 2026-04-29

## Decision: Implement contracts inside `ai-core`

**Rationale**: Spec #027 assigns content block ingestion and indexing orchestration to `ai-core`. A small public contract here lets future packages integrate without importing private implementation files.

**Alternatives considered**:

- Create a new shared RAG package: rejected because the current slice does not justify a new package boundary.
- Wait for `document-engine`: rejected because content block contracts are needed before document parsing can integrate cleanly.

## Decision: Use manual validation with Result

**Rationale**: The validation rules are simple and should return typed `AppError` values. Manual validation avoids creating a Zod schema layer before concrete parser packages exist.

**Alternatives considered**:

- Zod schemas: deferred until external inputs require parsing and schema reuse.
- Throwing validation errors: rejected by the Result pattern.

## Decision: Keep physical storage out of scope

**Rationale**: Spec #027 states logical models first. Tables and indexes should be introduced only when retrieval implementation needs them.

**Alternatives considered**:

- Add Prisma models now: rejected as premature because package ownership and ingestion usage are still incremental.
