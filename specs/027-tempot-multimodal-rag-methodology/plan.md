# Implementation Plan: Tempot Multimodal RAG Methodology

**Branch**: `027-tempot-multimodal-rag-methodology` | **Date**: 2026-04-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/027-tempot-multimodal-rag-methodology/spec.md`

## Summary

Define and prepare a Tempot-native multimodal RAG methodology inspired by HKUDS/RAG-Anything without adopting its Python runtime. The plan preserves Tempot's package boundaries by keeping AI orchestration in `ai-core`, future parsing in `document-engine`, future hybrid retrieval in `search-engine`, file ownership in `storage-engine`, and persistence in `database`.

The first execution slice is reconciliation and hardening of the existing `ai-core` source of truth. Multimodal and hybrid retrieval work follows as contract-driven package slices.

## Technical Context

**Language/Version**: TypeScript 5.9.3 strict mode
**Primary Dependencies**: Vercel AI SDK 6.x, Drizzle, Prisma, pgvector, neverthrow, i18next, Event Bus
**Storage**: PostgreSQL 16 + pgvector, storage-engine references for files and media
**Testing**: Vitest 4.1.0, Testcontainers for integration, future RAG eval fixtures
**Target Platform**: Node.js 22.12+ monorepo packages and Telegram bot runtime
**Project Type**: Monorepo package architecture with apps, packages, modules, and specs
**Performance Goals**: Retrieval plan p95 under 500ms for indexed text MVP; full answer latency budget documented per provider
**Constraints**: Result pattern, i18n-only user text, event-driven integration, package boundary enforcement, no Python runtime dependency
**Scale/Scope**: Tempot Core first, SaaS-ready data scope with future `botId` and `tenantId`

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Rule Area                             | Status | Notes                                                                       |
| ------------------------------------- | ------ | --------------------------------------------------------------------------- |
| TypeScript strict mode                | PASS   | Any future implementation remains TypeScript strict.                        |
| No hardcoded user text                | PASS   | User-facing messages must be i18n keys.                                     |
| Result pattern                        | PASS   | Contracts require `Result<T, AppError>` for fallible operations.            |
| Repository and data access boundaries | PASS   | `ai-core` consumes repositories/contracts, not direct Prisma service calls. |
| Event-driven communication            | PASS   | Module knowledge registration uses events and contracts.                    |
| Package isolation                     | PASS   | Parsing, retrieval, storage, and generation ownership are separated.        |
| TDD mandatory                         | PASS   | tasks.md requires failing tests before implementation tasks.                |
| Clean diff                            | PASS   | This planning slice changes specs and roadmap only.                         |

## Project Structure

### Documentation (this feature)

```text
specs/027-tempot-multimodal-rag-methodology/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   |-- content-block-contract.md
|   |-- retrieval-contract.md
|   |-- evaluation-contract.md
|-- checklists/
|   |-- requirements.md
|-- tasks.md
```

### Source Code (future implementation)

```text
packages/ai-core/
|-- src/rag/
|-- src/content/
|-- src/evaluation/
|-- tests/unit/
|-- tests/integration/

packages/database/
|-- src/drizzle/schema/
|-- tests/integration/

packages/document-engine/        # deferred until roadmap activation
packages/search-engine/          # deferred until roadmap activation
packages/import-engine/          # deferred until roadmap activation
packages/storage-engine/
modules/*/
```

**Structure Decision**: This feature documents cross-package RAG methodology and implementation contracts. Immediate work should reconcile `ai-core` and add contract-level hardening without activating all deferred packages. Deferred packages are activated only by explicit roadmap decision.

## Phase 0: Research Output

Research is captured in [research.md](./research.md). Key decisions:

- Use RAG-Anything as a methodology reference only.
- Use `ContentBlock` as the central abstraction.
- Keep parsing outside `ai-core`.
- Start text-first while preserving multimodal contracts.
- Treat hybrid retrieval as a contract, not one fixed algorithm.
- Require grounded answers with content block citations.
- Define evaluation as part of RAG core quality.

## Phase 1: Design Output

Design artifacts:

- [data-model.md](./data-model.md)
- [contracts/content-block-contract.md](./contracts/content-block-contract.md)
- [contracts/retrieval-contract.md](./contracts/retrieval-contract.md)
- [contracts/evaluation-contract.md](./contracts/evaluation-contract.md)
- [quickstart.md](./quickstart.md)

## Implementation Phases

### Phase A: Source Of Truth Reconciliation

Goal: Make existing `ai-core` documentation and SpecKit artifacts safe execution sources.

Scope:

- Fix env var drift in `packages/ai-core/README.md`.
- Remove or supersede stale provider refusal requirements.
- Reconcile `specs/015-ai-core-package/tasks.md` with actual implementation.
- Remove mojibake from affected AI docs where touched.
- Confirm current `ai-core` tests and exports match package README.

### Phase B: Content Block Contract

Goal: Introduce the RAG-Anything-inspired content block methodology without changing all parsers.

Scope:

- Define public TypeScript types for content sources, blocks, relationships, and grounding.
- Add tests for access policy, PII state, citation requirements, and vector compatibility rules.
- Keep physical schema changes behind an implementation decision.

### Phase C: Retrieval Planning And Grounding

Goal: Improve `ai-core` RAG behavior while preserving current pgvector implementation.

Scope:

- Add retrieval plan abstraction.
- Require cited blocks for answered state.
- Add no-context and degraded states.
- Add evaluation fixtures for retrieval and answer grounding.

### Phase D: Future Package Activation Decisions

Goal: Prepare activation criteria for `document-engine`, `search-engine`, and `import-engine`.

Scope:

- Document when each deferred package becomes necessary.
- Define package-specific specs before activation.
- Keep `ai-core` usable without those packages.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| None      | N/A        | N/A                                  |

## Post-Design Constitution Check

| Rule Area               | Status | Notes                                                |
| ----------------------- | ------ | ---------------------------------------------------- |
| TypeScript strict mode  | PASS   | Contracts will be typed.                             |
| i18n-only               | PASS   | No hardcoded user-facing text allowed.               |
| Result pattern          | PASS   | Explicit in contracts.                               |
| Package isolation       | PASS   | Boundaries are the primary design objective.         |
| Deferred package policy | PASS   | No deferred package is activated by this spec alone. |
