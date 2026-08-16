# ⏱️ Interaction Observability (`@tempot/interaction-observability`)

> Reusable user interaction timeline telemetry, latency tracking, and execution lifecycle recording for Tempot.

---

## 📋 Overview

`@tempot/interaction-observability` records per-interaction lifecycle events without coupling modules directly to the bot-server implementation. It tracks user command execution, callback queries, latency, and step transitions, outputting structured timeline spans for diagnostics and performance auditing.

---

## 🏗️ Architecture & Interfaces

```text
Bot Interaction Trigger ➔ Context Recorder ➔ Timeline Events ➔ Injected Storage/Logger Sink
```

### Core Contracts

- **`IInteractionRecorder`:** Interface for capturing interaction milestones (`start`, `step`, `complete`, `fail`).
- **`TimelineEvent`:** Structured event schema containing interaction ID, duration, handler name, and status.

---

## 💻 Usage Example

```typescript
import { createInteractionContext, type IInteractionRecorder } from '@tempot/interaction-observability';

// Starting a tracked interaction
const interaction = createInteractionContext('user_123', 'profile:edit');

interaction.recordStep('validate_input');
// ... perform business logic ...

interaction.complete({ status: 'SUCCESS', durationMs: 45 });
```

---

## 🧪 Testing

```bash
pnpm --filter @tempot/interaction-observability test
```
