# ADR-039: Native RAG Implementation over External Python Framework

## Context

We evaluated the [RAG-Anything](https://github.com/HKUDS/RAG-Anything) framework by HKUDS for potential inclusion in the `@tempot/ai-core` and `@tempot/search-engine` packages. RAG-Anything is an excellent all-in-one multimodal document processing framework that introduces advanced paradigms such as Adaptive Content Decomposition, Multimodal Knowledge Graph + Vector Fusion, and Modality-Aware Retrieval.

However, integrating RAG-Anything directly as a project dependency violates several core constraints established in the Constitution:
1. **Language Compatibility (Rule III & XLV):** RAG-Anything is a Python library, whereas Tempot is a strict TypeScript monorepo running on Node.js 20+.
2. **AI Provider Abstraction (Rule XVI & ADR-016):** Tempot exclusively uses the `Vercel AI SDK` for provider-agnostic AI integration. RAG-Anything relies on its own internal wrappers.
3. **Single Source of Truth (Rule XIV & ADR-017):** Tempot uses PostgreSQL with `pgvector` and Drizzle ORM for embeddings. RAG-Anything introduces isolated data silos (e.g., local files or external graph databases).
4. **System Dependencies:** RAG-Anything introduces heavy OS-level dependencies (LibreOffice, MinerU, OpenCV) that bloat the Docker container environment.

## Decision

We **reject** adding RAG-Anything or any similar Python-based RAG library as a direct dependency or microservice inside the main application flow.

Instead, we **accept** adopting the *architectural logic and methodology* of RAG-Anything as a theoretical blueprint (Reference Architecture) to build our own **Native TypeScript RAG** system.

Specifically, we will implement the methodology natively:
- **Adaptive Content Decomposition:** Using Vercel AI SDK vision models to extract captions and structure from multimodal documents instead of relying on Python-based OCR.
- **Graph-Vector Fusion:** Using PostgreSQL relationships (Foreign Keys for parent-child document chunks) combined with `pgvector` similarity search via Drizzle ORM to emulate a multimodal knowledge graph within our existing database.
- **Concurrent Processing:** Using our existing `@tempot/event-bus` (BullMQ) to process text and images in parallel workers.

## Consequences

- **Positive:** We maintain a 100% TypeScript, unified architecture. No heavy Python dependencies or duplicated AI abstraction layers. Container sizes remain small and deployment simple.
- **Positive:** We retain a single source of truth within PostgreSQL.
- **Negative:** We must build the orchestration and chunking logic ourselves instead of relying on an off-the-shelf framework.
- **Negative:** We miss out on the specialized, high-fidelity PDF/Document parsing provided by MinerU natively. (Note: If strict MinerU parsing becomes a hard business requirement in the future, it must be deployed as a completely isolated external service that the bot calls via REST/gRPC, keeping the core monorepo pure).
