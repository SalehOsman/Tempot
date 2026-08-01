# AI Resilience and Error Handling

## 1. System Resilience Architecture

The AI subsystem employs a robust 4-layer defense-in-depth strategy using the Cockatiel resilience library to manage transient failures and prevent cascading system degradation.

### 1.1 Cockatiel 4-Layer Stack Configuration

The resilience strategy implements the following harmonized policies:

| Layer | Policy Type | Configuration | Purpose |
| :--- | :--- | :--- | :--- |
| 1 | **Bulkhead** | `5` concurrent executions | Prevents AI operations from exhausting system thread pools. |
| 2 | **Circuit Breaker** | `5` consecutive failures / `600s` half-open duration | Halts external calls during sustained API outages. |
| 3 | **Retry** | `3` attempts (exponential backoff) | Handles transient network or API gateway errors. |
| 4 | **Timeout** | `30s` (Generation) / `10s` (Embedding) | Enforces strict SLA boundaries for user-facing operations. |

> [!NOTE]
> The embedding timeout is currently a hardcoded value of `10s` at [resilience.service.ts](file:///F:/Tempot/packages/ai-core/src/resilience/resilience.service.ts#L62).

## 2. Event Emission and Notification Gaps

System degradation events are detected and emitted by the AI service layer, but there are notable gaps in the notification pipeline.

### 2.1 Degradation Events

The system correctly emits degradation signals when the circuit breaker opens or sustained errors occur.
- **Emission Point**: `system.ai.degraded` is emitted at line 46 of the resilience service.

### 2.2 Integration Gap: Admin Notification

> [!WARNING]
> **Integration Gap**: Admin notifications for AI degradation are currently disconnected. The subscription at [deps.bot-factory.ts](file:///F:/Tempot/apps/bot-server/src/startup/deps.bot-factory.ts#L59) only listens for `system.alert.critical`. There is no verified bridge or listener established for the `system.ai.degraded` event, meaning administrators will not be automatically notified when AI services enter a degraded state.

## 3. User-Facing Error Handling

The system implements dynamic error rendering to gracefully handle failures during AI interactions, ensuring the user experience degrades smoothly rather than failing abruptly.

### 3.1 Help Center Integration

Dynamic error rendering is implemented in the `help-center` domain to provide context-aware feedback when AI generation fails.

- **[ask.command.ts](file:///F:/Tempot/modules/help-center/commands/ask.command.ts)**: Intercepts command failures and routes them to the response formatter.
- **[help-assistant-response.service.ts](file:///F:/Tempot/modules/help-center/services/help-assistant-response.service.ts)**: Formats detailed, user-friendly error messages based on the specific failure mode (e.g., timeout, circuit open, generic failure).

> [!TIP]
> Ensure all user-facing commands follow the pattern established in `ask.command.ts` for consistent error presentation across the application.
