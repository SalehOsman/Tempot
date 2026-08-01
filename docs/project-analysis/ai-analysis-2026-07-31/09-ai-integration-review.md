# 09. AI Integration Review

> [!NOTE]
> This document analyzes the integration points between the AI subsystem and other core Tempot services, focusing on infrastructure patterns, event bus interactions, and error handling implementations.

## 9.1 Overview of Integration Points

The AI subsystem in Tempot interfaces with several core infrastructure components:
- Database connectivity (PostgreSQL)
- Event Bus orchestration
- Client presentation layers (Help Center)

## 9.2 Methodology

This review assesses cross-boundary dependencies and pinpoints architectural gaps, performance bottlenecks, and missing links in observability and alerting.

## 9.3 Database & Infrastructure Integration

### 9.3.1 High-Impact: Fragmented Composition & Connection Churn

> [!CAUTION]
> Significant connection churn has been identified due to fragmented database pool management during AI lifecycle execution.

**Finding:** Code paths in the AI assistants are generating transient database connection pools instead of utilizing the application-wide singleton pool. 

- [help-ai-assistant.provider.ts](file:///F:/Tempot/apps/bot-server/src/startup/help-ai-assistant.provider.ts#L63) (line 63) instantiates `new Pool()` per request.
- [knowledge-live-runtime.ts](file:///F:/Tempot/apps/bot-server/src/startup/knowledge-live-runtime.ts#L77-L123) (lines 77, 123) instantiates `new Pool()` per runtime creation.

**Mitigating Factor:**
The implementations do perform resource cleanup. The `pool.end()` cleanup exists in `finally` blocks in these locations.

**Priority:** P1 High
**Recommendation:** Refactor AI providers to accept injected, long-lived connection pools from the core infrastructure dependency injection container.

## 9.4 Event Bus Orchestration

The event bus acts as the primary nervous system for decoupled service communication. We evaluated how AI operational states transition to system-wide alerts.

> [!WARNING]
> **Integration Gap: AI degradation event is emitted, but no verified bridge to SUPER_ADMIN critical alert exists.**

**Analysis:**
- The AI resilience module properly detects and broadcasts failure states. [resilience.service.ts](file:///F:/Tempot/packages/ai-core/src/resilience/resilience.service.ts#L46) (line 46) emits `system.ai.degraded`.
- However, the downstream bot factory [deps.bot-factory.ts](file:///F:/Tempot/apps/bot-server/src/startup/deps.bot-factory.ts#L59) (line 59) ONLY subscribes to `system.alert.critical`.
- No active translation layer or event bridge elevates `system.ai.degraded` to `system.alert.critical`, meaning AI degradation might go unnoticed by SUPER_ADMIN workflows.

## 9.5 Client Presentation Integration

### 9.5.1 Help Center Dynamic Error Rendering

The integration between AI backend services and the frontend `help-center` employs dynamic error rendering to gracefully handle generation failures or rate limits.

- **Request Handling:** [ask.command.ts](file:///F:/Tempot/modules/help-center/commands/ask.command.ts) processes the incoming user query and wraps the AI invocation in a resilient command pattern.
- **Response Formatting:** [help-assistant-response.service.ts](file:///F:/Tempot/modules/help-center/services/help-assistant-response.service.ts) structures the AI output for the client, incorporating dynamic fallback templates and error boundaries when the AI service degrades or times out.

## 9.6 Summary of Action Items

| Item | Component | Issue | Priority |
|---|---|---|---|
| 1 | DB Connections | `new Pool()` per request in `help-ai-assistant.provider.ts` and `knowledge-live-runtime.ts` | P1 High |
| 2 | Event Bus | Missing bridge from `system.ai.degraded` to `system.alert.critical` | P2 Medium |
