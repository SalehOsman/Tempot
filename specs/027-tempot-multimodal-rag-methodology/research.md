# Research: Tempot Multimodal RAG Methodology

**Feature**: 027-tempot-multimodal-rag-methodology  
**Date**: 2026-04-29

## Source Review

### RAG-Anything Methodology Reference

**Decision**: Use RAG-Anything as a methodology reference for multimodal RAG, not as a code dependency.

**Rationale**: The project demonstrates a staged approach that separates document parsing, content analysis, knowledge graph style relationships, and intelligent retrieval. That maps well to Tempot's existing package boundaries, but the implementation is Python-based and should not be embedded in the TypeScript runtime.

**Alternatives considered**:

- Add RAG-Anything as a Python sidecar: rejected because it violates Tempot package isolation and increases deployment complexity.
- Reimplement every feature immediately in `ai-core`: rejected because it would turn `ai-core` into a monolith.
- Use the methodology as a design reference: accepted because it preserves Tempot architecture while adopting the useful RAG model.

**References**:

- https://github.com/HKUDS/RAG-Anything
- https://github.com/HKUDS/RAG-Anything/blob/main/docs/context_aware_processing.md

## Design Decisions

### D1. Content Blocks Are The Central Abstraction

**Decision**: Normalize every source into `ContentBlock` records before indexing.

**Rationale**: Content blocks let Tempot represent text, tables, images, formulas, charts, and future modalities consistently. They also allow direct insertion of already parsed content, which mirrors the RAG-Anything content-list idea while staying TypeScript-native.

**Alternatives considered**:

- Store only raw documents: rejected because retrieval cannot cite precise sources.
- Store only text chunks: rejected because multimodal RAG loses structure.

### D2. Keep Parsing Outside `ai-core`

**Decision**: `ai-core` consumes content blocks but does not own full document parsing.

**Rationale**: Parsing belongs to `document-engine` or `import-engine` when those deferred packages are activated. `ai-core` should orchestrate retrieval, generation, grounding, and provider behavior.

**Alternatives considered**:

- Put all parsing inside `ai-core`: rejected due separation-of-concerns risk.
- Delay all RAG design until document-engine exists: rejected because current `ai-core` already has RAG behavior and needs a governing methodology.

### D3. Text-First MVP With Multimodal Contracts

**Decision**: The first implementation slice may be text-first, but contracts must model multimodal blocks from day one.

**Rationale**: This gives immediate value while avoiding a future breaking redesign.

**Alternatives considered**:

- Implement all modalities first: rejected as too broad.
- Model only text now: rejected because it would block RAG-Anything-style evolution.

### D4. Hybrid Retrieval Is A Contract, Not One Algorithm

**Decision**: Define hybrid retrieval as a retrieval plan that can combine vector search, lexical search, content relationships, role filters, content type filters, and reranking.

**Rationale**: RAG quality depends on more than vector similarity. Tempot should support multiple retrieval signals without hardcoding one algorithm into `ai-core`.

**Alternatives considered**:

- Vector-only retrieval: accepted only as the current baseline, not the final methodology.
- Full graph retrieval immediately: rejected until database and search ownership are ready.

### D5. Relationship Graph Starts Logical

**Decision**: Define `BlockRelationship` as a logical model now, with physical storage deferred to implementation planning.

**Rationale**: Relationships are central to multimodal RAG because tables, captions, images, and paragraphs often explain each other. The storage shape can evolve after package ownership is finalized.

**Alternatives considered**:

- Add a graph database now: rejected as premature.
- Ignore relationships: rejected because it weakens multimodal retrieval quality.

### D6. Grounding And Citation Are Mandatory

**Decision**: Generated answers must carry source citations to retrieved content blocks, or return a no-context response.

**Rationale**: Tempot is an enterprise bot framework. Unsupported generation is a product and security risk.

**Alternatives considered**:

- Let the model answer with best effort: rejected.
- Cite documents only, not blocks: rejected because citations need precise traceability.

### D7. Evaluation Is Part Of The RAG Core

**Decision**: Define a RAG evaluation dataset and metrics as part of the methodology.

**Rationale**: Without evaluation, RAG quality cannot be improved safely. Metrics must cover retrieval hits, citation coverage, unsupported-answer rate, latency, and cost.

**Alternatives considered**:

- Manual review only: rejected because it is not repeatable.
- Provider-specific evals only: rejected because Tempot supports provider abstraction.

### D8. Provider Switching Requires Index Compatibility Rules

**Decision**: Embedding provider or dimension changes require explicit re-indexing or dual-index migration.

**Rationale**: Different embedding spaces are not compatible. Silent provider fallback for embeddings would corrupt search quality.

**Alternatives considered**:

- Automatic fallback between embedding providers: rejected.
- Manual warning only: insufficient without a migration plan.

### D9. SaaS And Multi-Bot Readiness Must Be Preserved

**Decision**: All future persisted RAG entities must be ready to carry `botId` and `tenantId` even if Tempot Core initially uses a single bot.

**Rationale**: The project has an approved future SaaS track. RAG content is high-value tenant data and must be isolated early.

**Alternatives considered**:

- Add tenant fields only when SaaS starts: rejected due migration risk.

### D10. Current `ai-core` Needs Reconciliation Before Expansion

**Decision**: The first execution slice should reconcile current ai-core documentation, stale spec decisions, README env vars, i18n gaps, and tests before major new RAG behavior.

**Rationale**: Building new RAG features on stale specs increases drift. Tempot's Rule L requires documentation and code parity.

**Alternatives considered**:

- Start implementing multimodal ingestion immediately: rejected until the current ai-core source of truth is clean.
