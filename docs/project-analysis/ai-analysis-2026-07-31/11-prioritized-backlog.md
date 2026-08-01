# 11. Prioritized Backlog

> [!NOTE]
> This prioritized backlog synthesizes the findings from the AI subsystem analysis, aligning tasks with the harmonized Tempot project standards. It provides an actionable roadmap for the Product Owner and Engineering Lead to track remediation efforts.

## Harmonized Standards: Priority Rules

The backlog items are classified strictly according to the following priority matrix:

- **P1 (High):** Production reliability, security, resource churn, or missing event bridges. These block production deployments.
- **P2 (Medium):** Operational enhancements, configuration fixes, performance optimizations. Scheduled for fast-follows.
- **P3 (Low):** Developer Experience (DX), tooling, and long-term multi-node scalability tasks.

---

## P1 Items (High Priority)

> [!IMPORTANT]
> The following items represent critical risks to system stability and security. They must be resolved prior to the general availability rollout.

| ID | Title | Description & Impact | Evidence |
| :--- | :--- | :--- | :--- |
| **P1-01** | Shared DB Pool Reuse in AI Providers | Providers currently risk connection churn under load. A shared pool reuse architecture is required, although the `pool.end()` cleanup logic is present. | [help-ai-assistant.provider.ts](file:///F:/Tempot/apps/bot-server/src/startup/help-ai-assistant.provider.ts#L63)<br>[knowledge-live-runtime.ts](file:///F:/Tempot/apps/bot-server/src/startup/knowledge-live-runtime.ts#L77-L123) |
| **P1-02** | RAG Context Boundary Delimiters & Injection Guard | Missing robust delimiters around injected knowledge blocks, leaving the system vulnerable to prompt injection via untrusted ingested content. | [intent.router.ts](file:///F:/Tempot/packages/ai-core/src/router/intent.router.ts#L145) |
| **P1-03** | Integration Bridge for AI Degradation Alerts | The resilience service detects AI failures but does not properly escalate them to the critical alerting pipeline. Bridge `system.ai.degraded` to `system.alert.critical`. | [resilience.service.ts](file:///F:/Tempot/packages/ai-core/src/resilience/resilience.service.ts#L46)<br>[deps.bot-factory.ts](file:///F:/Tempot/apps/bot-server/src/startup/deps.bot-factory.ts#L59) |
| **P1-04** | Staging Vector Write Smoke Test Evidence Collection | Lack of documented evidence confirming vector database write stability in the staging environment under concurrent loads. | Staging Configuration |

---

## P2 Items (Medium Priority)

> [!WARNING]
> While not strictly blocking for initial release, these items represent significant technical debt or configuration gaps that will impact operational efficiency and observability.

| ID | Title | Description & Impact | Evidence |
| :--- | :--- | :--- | :--- |
| **P2-01** | Rate Limiter & Resilience Config Wiring | The configuration for rate limiters is partially hardcoded or unlinked from the environment variables framework. Requires proper `process.env` mapping. | [ai-core.config.ts](file:///F:/Tempot/packages/ai-core/src/ai-core.config.ts#L50) |
| **P2-02** | Redis Adapter for ConfirmationEngine | The current confirmation engine relies on local memory. A Redis adapter is required (Note: P2 for single-node deployments; escalates to P1 for multi-node deployments). | [confirmation.engine.ts](file:///F:/Tempot/packages/ai-core/src/confirmation/confirmation.engine.ts#L18) |
| **P2-03** | Batch Embedding Pipeline | Optimize the embedding generation process by utilizing `embedMany` instead of sequential single-document requests. | Embedding Services |
| **P2-04** | Streaming Response Integration | Improve perceived latency and user experience by wiring `streamText` capabilities through the API to the client. | Client APIs |
| **P2-05** | Incremental Content Hash Ingestion | Prevent redundant database updates and LLM calls by checking content hashes before triggering the ingestion pipeline. | Ingestion Pipeline |

---

## P3 Items (Low Priority)

> [!TIP]
> These items focus on long-term enhancements, improving search recall, and keeping developer documentation in sync with architectural evolution.

| ID | Title | Description & Impact | Evidence |
| :--- | :--- | :--- | :--- |
| **P3-01** | Hybrid Search (BM25 + Vector) | Enhance knowledge retrieval accuracy by augmenting the vector similarity search with sparse lexical search (BM25). | Retrieval Strategy |
| **P3-02** | AI Documentation Synchronization | Establish a CI/CD process to keep architectural diagrams and interface documentation synchronized with the current implementation state. | Tooling |
