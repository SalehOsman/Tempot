# Feature Specification: Tempot Multimodal RAG Methodology

**Feature Branch**: `027-tempot-multimodal-rag-methodology`
**Created**: 2026-04-29
**Status**: Draft
**Input**: Project Manager request: "Adopt the RAG methodology used by HKUDS/RAG-Anything without using its Python code. Build a complete Tempot-native plan and specification."

## User Scenarios & Testing

### User Story 1 - Architecture Owner Defines A Tempot-Native RAG Methodology (Priority: P1)

As the project owner, I want a clear Tempot-native RAG methodology inspired by RAG-Anything so that future AI, document, search, and import work follows one consistent architecture.

**Why this priority**: This prevents implementation drift before adding more AI functionality.

**Independent Test**: Review this specification and verify that it explains the RAG stages, package boundaries, responsibilities, and non-goals without requiring Python code or the RAG-Anything runtime.

**Acceptance Scenarios**:

1. **Given** a future contributor reads the spec, **When** they plan RAG work, **Then** they can identify which responsibility belongs in `ai-core`, `document-engine`, `search-engine`, `storage-engine`, or `database`.
2. **Given** RAG-Anything is referenced, **When** the methodology is evaluated, **Then** it is treated as a design reference only and is not added as a runtime dependency.
3. **Given** a new content type is proposed, **When** it is reviewed, **Then** it can be mapped to the Tempot content block model before indexing.

---

### User Story 2 - Developer Builds Content Blocks Before Retrieval (Priority: P1)

As a package developer, I want all documents and media to be normalized into typed content blocks before indexing so that text, tables, images, charts, formulas, and metadata can be processed consistently.

**Why this priority**: The content block abstraction is the foundation for multimodal RAG and package isolation.

**Independent Test**: Provide a sample mixed document and verify the plan can represent it as ordered content blocks with source references, modality, metadata, and access policy.

**Acceptance Scenarios**:

1. **Given** a document contains paragraphs, tables, and images, **When** it is parsed, **Then** each part becomes a typed content block with stable source references.
2. **Given** content is already parsed by an external importer, **When** it reaches Tempot RAG, **Then** it can bypass document parsing and enter through the content block contract.
3. **Given** a block contains sensitive data, **When** it is prepared for embeddings, **Then** PII sanitization and access policy are applied before storage.

---

### User Story 3 - User Receives Grounded Answers From Hybrid Retrieval (Priority: P1)

As a bot user, I want AI answers to be grounded in authorized retrieved context so that answers are useful, traceable, and do not expose unauthorized information.

**Why this priority**: RAG quality and access control are security requirements, not optional enhancements.

**Independent Test**: Ask a question that needs a table, a text paragraph, and an image description; verify the answer cites authorized blocks and refuses unsupported claims.

**Acceptance Scenarios**:

1. **Given** relevant authorized content exists, **When** the user asks a question, **Then** the retrieval plan combines semantic matches, lexical signals, relationships, and content-type filters.
2. **Given** no authorized content meets the confidence threshold, **When** the user asks a question, **Then** the assistant returns an i18n no-context response instead of fabricating.
3. **Given** content exists but the user lacks permission, **When** retrieval runs, **Then** the content is excluded before generation.

---

### User Story 4 - Operator Evaluates RAG Quality And Cost (Priority: P2)

As an operator, I want RAG indexing, retrieval, and generation to be measurable so that I can track quality, latency, token usage, and failure modes.

**Why this priority**: Professional RAG requires evaluation and observability before scaling.

**Independent Test**: Run a documented evaluation set and verify metrics exist for retrieval precision, grounded answer rate, latency, and cost.

**Acceptance Scenarios**:

1. **Given** an evaluation dataset exists, **When** the RAG evaluator runs, **Then** it reports retrieval hit rate, citation coverage, unsupported-answer rate, and latency.
2. **Given** a provider degrades, **When** RAG requests continue, **Then** provider, model, retry, fallback, and circuit-breaker events are audit-visible.
3. **Given** token or embedding budgets are configured, **When** a request exceeds them, **Then** the system returns a controlled Result error and records the decision.

---

### User Story 5 - Future Packages Integrate Through Contracts (Priority: P2)

As a future package developer, I want `document-engine`, `search-engine`, `import-engine`, and `ai-core` to integrate through stable contracts so that each package can be implemented independently.

**Why this priority**: This preserves Tempot's separation of concerns and avoids turning `ai-core` into a monolith.

**Independent Test**: Use the contracts in this spec to implement one package slice without importing internal files from another package.

**Acceptance Scenarios**:

1. **Given** `document-engine` is implemented later, **When** it emits parsed content, **Then** `ai-core` consumes only the public content block contract.
2. **Given** `search-engine` is implemented later, **When** hybrid retrieval is activated, **Then** `ai-core` delegates retrieval through a public search contract.
3. **Given** a module wants RAG, **When** it registers knowledge sources, **Then** it does so through events and public contracts only.

## Edge Cases

- Corrupt or unsupported files are rejected with a typed Result error and a localized user-facing message.
- Documents larger than configured limits are chunked only if safe; otherwise they are rejected before embedding.
- Tables or charts with no reliable extraction are stored as low-confidence blocks and must not support high-confidence answers alone.
- Duplicate or near-duplicate content does not create unbounded index growth.
- Provider-specific embedding spaces are not mixed without a re-indexing plan.
- Image, audio, or PDF content that cannot be represented safely is stored as metadata only until a capable processor is available.
- Authorization is enforced before retrieval and again before answer generation context is built.
- The methodology must not require RAG-Anything as a runtime dependency, Python service, subprocess, or container.

## Requirements

### Functional Requirements

- **FR-001**: The project MUST document a Tempot-native RAG methodology inspired by RAG-Anything while explicitly prohibiting a runtime dependency on the Python project.
- **FR-002**: The methodology MUST define a content pipeline with these logical stages: ingestion, parsing, content analysis, content block normalization, indexing, retrieval planning, grounded generation, evaluation, and observability.
- **FR-003**: The methodology MUST define a `ContentBlock` abstraction for text, table, image, chart, formula, audio, video, PDF page, and custom metadata blocks.
- **FR-004**: The methodology MUST support direct insertion of pre-parsed content blocks so future importers can bypass document parsing.
- **FR-005**: The methodology MUST assign package ownership boundaries for `ai-core`, `document-engine`, `search-engine`, `storage-engine`, `database`, and future modules.
- **FR-006**: The methodology MUST require access control before retrieval and before context assembly.
- **FR-007**: The methodology MUST define hybrid retrieval as a combination of semantic vector search, lexical search, content relationships, content type filters, confidence thresholds, and optional reranking.
- **FR-008**: The methodology MUST require answer grounding with citations to retrieved content blocks.
- **FR-009**: The methodology MUST define no-context behavior that returns an i18n response instead of unsupported generation.
- **FR-010**: The methodology MUST define multimodal handling without assuming every modality is available on day one.
- **FR-011**: The methodology MUST define evaluation metrics for retrieval quality, answer grounding, latency, and cost.
- **FR-012**: The methodology MUST define provider and embedding-model compatibility rules, including re-indexing requirements when vector spaces change.
- **FR-013**: The methodology MUST keep public fallible operations aligned with `Result<T, AppError>`.
- **FR-014**: The methodology MUST define event-driven integration points for modules and future packages.
- **FR-015**: The methodology MUST define a phased implementation path that can start by hardening existing `ai-core` before activating deferred packages.

### Key Entities

- **ContentSource**: A document, message, uploaded file, module artifact, or imported dataset that can produce content blocks.
- **ContentBlock**: A typed normalized unit of retrievable content with source reference, modality, metadata, access policy, and extraction confidence.
- **BlockRelationship**: A relationship between blocks, such as page order, table caption, image belongs-to section, or formula explains paragraph.
- **KnowledgeIndex**: The logical index that stores embeddings, lexical tokens, metadata, and relationship references.
- **RetrievalPlan**: The strategy selected for a query, including filters, retrieval modes, reranking, and confidence thresholds.
- **GroundedAnswer**: An assistant answer with citations, confidence, refusal or no-context state, and audit metadata.
- **RAGEvaluationCase**: A test case with query, expected sources, expected answer constraints, role, locale, and scoring rules.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A future agent can identify package ownership for every RAG stage without reading implementation internals.
- **SC-002**: The specification contains zero dependency requirement on RAG-Anything runtime code.
- **SC-003**: Every P1 user story has independently testable acceptance criteria.
- **SC-004**: The plan defines at least one MVP implementation slice that improves current `ai-core` without activating all deferred packages.
- **SC-005**: The methodology defines evaluation metrics for retrieval quality, grounded answer rate, latency, and cost.
- **SC-006**: `pnpm spec:validate` can pass after this planning feature is added.

## Assumptions

- Existing `@tempot/ai-core` remains the orchestration package for AI provider, generation, RAG pipeline, and answer grounding.
- `document-engine`, `search-engine`, and `import-engine` remain deferred until roadmap activation, but their future contracts can be documented now.
- Multimodal support is planned as a staged capability; text-first delivery is acceptable only if the contracts preserve future modalities.
- Arabic remains the primary user-facing language, and all user-facing messages must come from i18n keys.
- RAG-Anything is used as an architecture reference only.
