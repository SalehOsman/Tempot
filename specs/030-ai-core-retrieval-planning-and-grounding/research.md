# Research: AI Core Retrieval Planning And Grounding

**Feature**: 030-ai-core-retrieval-planning-and-grounding
**Date**: 2026-04-29

## Decision: Model retrieval as an explicit plan

**Rationale**: Spec #027 requires hybrid retrieval without forcing a single algorithm today. An explicit plan lets the current vector-first implementation and future `search-engine` use the same public contract.

**Alternatives considered**:

- Keep retrieval implicit inside `RAGPipeline`: rejected because future lexical, relationship, and rerank stages would become private implementation details.
- Activate `search-engine` immediately: rejected because the contract should be stable before adding a package boundary.

## Decision: Require access filtering in every executable plan

**Rationale**: Unauthorized content must never reach generation context. Making access filtering a validation requirement enforces the architecture at the contract boundary.

**Alternatives considered**:

- Filter after retrieval only: rejected because relationship expansion and reranking can otherwise leak unauthorized candidates into intermediate context.
- Trust callers to remember access filtering: rejected because methodology rules should be enforceable.

## Decision: Use structured answer states

**Rationale**: User interfaces and modules should react to `answered`, `no-context`, `degraded`, and `refused` states without parsing natural language text. This also preserves the i18n-only rule.

**Alternatives considered**:

- Return plain answer text: rejected because it hides grounding status.
- Throw for no-context or degraded states: rejected because these are expected outcomes, not exceptional failures.

## Decision: Keep runtime pipeline wiring separate if needed

**Rationale**: The first slice should stabilize public contracts and validation. Runtime behavior changes can be added in a follow-on task after TDD proves the contract is correct.

**Alternatives considered**:

- Rewrite the existing RAG pipeline now: rejected as too broad for one slice and risky without evaluation fixtures.
