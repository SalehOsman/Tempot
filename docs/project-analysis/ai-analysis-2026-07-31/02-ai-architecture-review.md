# 02. AI Architecture Review

> [!NOTE]
> **Persona:** Lead AI Architect
> **Objective:** Evaluate the structural integrity, component boundaries, and dependency management of the AI subsystem within the Tempot project, ensuring adherence to architectural standards.

## 2.1 Overview

This document provides a comprehensive architectural review of the AI subsystem, analyzing the structural composition, key architectural decisions, and dependency boundaries. The analysis focuses on ensuring scalability, maintainability, and alignment with project-wide standards.

## 2.2 Core Components

The AI architecture is structured around modular providers and runtimes that facilitate knowledge retrieval, assistant capabilities, and lifecycle management.

| Component | Responsibility | Pattern |
| :--- | :--- | :--- |
| **Help AI Assistant** | Manages interactive AI assistant capabilities and prompt construction. | Provider Pattern |
| **Knowledge Live Runtime** | Executes live queries and knowledge retrieval workflows. | Runtime Engine |
| **DI Container** | Resolves core AI services and abstractions. | Inversion of Control |

## 2.3 Key Architectural Decisions (ADRs)

The AI subsystem's architecture is governed by several critical Architecture Decision Records (ADRs). These must be strictly adhered to during implementation and refactoring.

| ADR | Description | Status |
| :--- | :--- | :--- |
| **ADR-016** | AI Provider Strategy and Registration | Active |
| **ADR-017** | LLM Context Window Management | Active |
| **ADR-031** | AI Event Bus Architecture | Active |
| **ADR-037** | Caching Strategies for AI Responses | Active |
| **ADR-039** | AI Subsystem Logging and Auditing | Active |

## 2.4 Dependency Injection (DI) Contracts

The AI subsystem relies on strict interfaces to decouple core logic from external dependencies. The following 5 DI contracts are mandatory for AI component composition:

1. **`AIRegistry`**: Manages the registration and discovery of AI model providers.
2. **`AILogger`**: Handles structured logging and audit trails for AI operations.
3. **`AIEventBus`**: Facilitates asynchronous event-driven communication across AI boundaries.
4. **`AICache`**: Governs caching mechanisms for prompt templates and completion results.
5. **`AIAbilityChecker`**: Evaluates runtime permissions and capabilities for AI features.

## 2.5 Component Boundaries & Risks

### 2.5.1 Excessive Per-Request Pool Creation / Connection Churn Risk

> [!WARNING]
> **Priority: P1 High**
> The current composition boundary exhibits a significant risk related to connection churn due to excessive per-request database pool creation.

**Finding details:**
During the review of the database connection lifecycle within the AI providers, it was observed that connection pools are being instantiated on a per-request basis.

**Evidence:**
*   [help-ai-assistant.provider.ts](file:///F:/Tempot/apps/bot-server/src/startup/help-ai-assistant.provider.ts#L63)
*   [knowledge-live-runtime.ts](file:///F:/Tempot/apps/bot-server/src/startup/knowledge-live-runtime.ts#L77-L123)

**Mitigation & Status:**
It is critical to note that **there is NO unmanaged leak**. The codebase correctly implements `pool.end()` within `finally` blocks at the identified locations (`help-ai-assistant.provider.ts:63` and `knowledge-live-runtime.ts:77,123`). However, the constant tearing down and rebuilding of the connection pool (Connection Churn) severely impacts performance and scalability under load.

**Actionable Recommendation:**
Refactor the connection management to utilize a long-lived, singleton connection pool injected via the DI container, rather than creating and destroying pools per request.
