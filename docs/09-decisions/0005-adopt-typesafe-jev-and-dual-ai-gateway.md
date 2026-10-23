# 5. Adopt TypeSafe AI `jev` and Dual System One/Two AI Gateway

Date: 2026-10-23

## Status
Accepted

## Context
Omnichannel bots and business automation engines require both:
1. Fast, deterministic, structured decision-making (intent triage, safety gating, command execution).
2. Natural language conversational intelligence and reasoning.

Relying exclusively on standard generative LLMs (e.g. GPT-4, Gemini) for simple control flow introduces high latency (1–3 seconds), non-deterministic JSON parse errors, high token costs, and vulnerability to prompt injection.

## Decision
We adopt a **Dual-Tier Cognitive Engine** in `modules/kernel/ai-gateway`:
1. **Tier 1 (System One): TypeSafe AI `jev` (typesafe.ai):**
   - Evaluates state and typed schemas in a single fast parallel pass.
   - Outputs strict probabilities, confidence scores, and categorical decisions rather than prose.
   - Controls workflow routing, security triage, and intent gating in sub-millisecond execution.
2. **Tier 2 (System Two): Generative LLM Gateway (Google Gemini 2.5 & DeepSeek-V3/R1):**
   - Invoked only when generative synthesis, long-form drafting, or open-ended multi-turn dialog is required.
   - Guarded upstream by `jev`.
3. **Packaging Strategy:**
   - Provider drivers live in `@tembot/ai-core` (or integrated package adapter).
   - Governance, API keys, token cost accounting, and Web Admin UI live in `modules/kernel/ai-gateway`.

## Consequences
### Positive
- Sub-millisecond intent classification and safety checks without cloud LLM lag.
- Zero prompt-injection risk on deterministic control flow paths.
- Huge cost savings: 80%+ of routine bot interactions resolve via Jev without incurring generative token fees.
- Unified dashboard visibility into token spend across Gemini and DeepSeek.
