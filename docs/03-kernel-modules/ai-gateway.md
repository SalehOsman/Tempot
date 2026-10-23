# Kernel Module: AI Gateway (`ai-gateway`)

> **Architectural Paradigm:** Dual-Tier System One + System Two Cognitive Engine  
> **System One Engine:** TypeSafe AI `jev` (Deterministic Probabilistic Decision Engine)  
> **System Two Engine:** Generative LLMs (Google Gemini 2.5 Flash/Pro, DeepSeek-V3 / R1)  
> **Authority & Registry:** `modules/kernel/ai-gateway`

---

## 1. Architectural Responsibility

The `ai-gateway` module provides an enterprise-grade, omnichannel AI control plane uniting:
1. **System One Decision-Making (TypeSafe AI `jev`):**
   * Sub-millisecond, deterministic evaluations over structured JSON state.
   * Single-pass probability scoring, intent classification, and safety/PII triage.
   * Confidence threshold gating (execute automatically if confidence $> 90\%$, route to generative model or human escalation if lower).
2. **System Two Generative Synthesis (Gemini & DeepSeek):**
   * Contextual multi-turn conversational replies in the Telegram Bot and TMA.
   * Content summarization, language translation, and complex business drafting.
3. **Cost, Quota & Token Accounting:**
   * Tracking per-user, per-slice, and per-tenant token usage and financial cost in PostgreSQL.
   * Web Admin Dashboard views for live model latency, fallback events, and spend analytics.

---

## 2. Dual-Engine Interaction Workflow

```mermaid
flowchart TD
    UserMsg["Inbound Ingress\n(Bot Message / TMA Form / Web Request)"] --> Gateway["ai-gateway Port (AiGatewayPort)"]
    
    subgraph SystemOne ["Tier 1: TypeSafe AI jev (System One Engine)"]
        JevEngine["jev Decision Engine\n(Fast Parallel Pass)"]
        JevIntent["Intent Classification & Entity Scoring"]
        JevGuard["Security, Injection & PII Masking"]
        JevConfidence{"Confidence $\ge$ Threshold?"}
    end

    subgraph SystemTwo ["Tier 2: Generative LLMs (System Two Engine)"]
        Router["Model Router & Fallback Chain"]
        Gemini["Google Gemini 2.5 (Flash / Pro)"]
        DeepSeek["DeepSeek-V3 / R1"]
    end

    subgraph Accounting ["Governance & Cost Accounting"]
        UsageLogger["ai_usage_logs Table\n(Tokens, Latency, Cost USD)"]
    end

    Gateway --> JevEngine
    JevEngine --> JevGuard
    JevGuard --> JevIntent
    JevIntent --> JevConfidence

    JevConfidence -->|"High Confidence Direct Action"| SliceAction["Direct Slice Execution\n(e.g., Cancel Order, Check Balance)"]
    JevConfidence -->|"Requires Generative Synthesis"| Router

    Router --> Gemini
    Router -.->|"Fallback / Complex Reasoning"| DeepSeek

    Gemini --> UsageLogger
    DeepSeek --> UsageLogger
    SliceAction --> UsageLogger
```

---

## 3. Public Ports & Capabilities

```typescript
export interface AiGatewayPort {
  /**
   * System One: Fast deterministic decision evaluation via TypeSafe AI jev.
   */
  evaluateDecision<TSchema>(
    state: Record<string, unknown> | string,
    schema: TSchema,
  ): Promise<Result<JevDecisionResult<TSchema>, AiGatewayError>>;

  /**
   * System Two: Generative response synthesis with automatic fallback.
   */
  generateResponse(
    request: AiGenerationRequest,
  ): Promise<Result<AiGenerationResponse, AiGatewayError>>;
}
```

Exposed Capabilities:
- `ai:evaluate`: Run System One decision scoring via `jev`.
- `ai:generate`: Run generative LLM workflows via Gemini/DeepSeek.
- `ai:manage`: Configure model keys, fallback chains, and view usage metrics in the Admin Dashboard.
