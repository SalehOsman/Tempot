# AI Core RAG Reconciliation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reconcile `ai-core` with Spec #027 and remove hardcoded confirmation prose from package source.

**Architecture:** Keep the current `IntentResult` contract shape and return an i18n key for confirmation responses. Return JSON machine status from the AI SDK tool callback so user-facing text remains owned by UI/i18n layers.

**Tech Stack:** TypeScript 5.9.3, Vitest 4.1.0, neverthrow 8.2.0, Vercel AI SDK 6.x.

---

## Files

- Modify: `packages/ai-core/tests/unit/intent.router.test.ts`
- Modify: `packages/ai-core/src/router/intent.router.ts`
- Modify: `packages/ai-core/README.md`
- Modify: `specs/015-ai-core-package/spec.md`
- Modify: `specs/015-ai-core-package/tasks.md`
- Modify: `specs/027-tempot-multimodal-rag-methodology/tasks.md`
- Modify: `docs/archive/ROADMAP.md`

## Task 1: Confirmation Output TDD

- [ ] **Step 1: Write failing assertions**

Update the existing confirmation flow test so it expects `value.response` to be `ai-core.confirmation.required`. Inside the mocked `generateText` callback, capture the return value from `tools['delete-user'].execute()` and assert that parsing it as JSON yields:

```json
{
  "status": "confirmation_required",
  "confirmationId": "conf-123",
  "toolName": "delete-user"
}
```

- [ ] **Step 2: Run RED**

Run:

```powershell
pnpm --filter @tempot/ai-core test -- tests/unit/intent.router.test.ts
```

Expected: the confirmation test fails because the current implementation returns English prose.

- [ ] **Step 3: Implement GREEN**

In `packages/ai-core/src/router/intent.router.ts`, add constants for `ai-core.confirmation.required` and `confirmation_required`. Use the response key in `route()` and JSON status in the confirmation tool callback.

- [ ] **Step 4: Run GREEN**

Run:

```powershell
pnpm --filter @tempot/ai-core test -- tests/unit/intent.router.test.ts
```

Expected: all tests in the file pass.

## Task 2: Documentation Reconciliation

- [ ] **Step 1: Update README provider guidance**

Replace `AI_PROVIDER` with `TEMPOT_AI_PROVIDER` and ensure environment examples match `ai-core.config.ts`.

- [ ] **Step 2: Update Spec #015**

Supersede the provider refusal edge case and replace obsolete task state with reconciled status.

- [ ] **Step 3: Update roadmap and Spec #027 handoff**

Point the active RAG workstream to Spec #028 and mark the follow-on spec task complete.

## Task 3: Verification

- [ ] Run `pnpm --filter @tempot/ai-core test`
- [ ] Run `pnpm spec:validate`
- [ ] Run `pnpm lint`
- [ ] Run `git diff --check`
- [ ] Search for stale active guidance:

```powershell
git grep -n "AI_PROVIDER\|PROVIDER_REFUSAL\|AIDegradationMode" -- packages/ai-core specs/015-ai-core-package specs/028-ai-core-rag-reconciliation docs/archive/ROADMAP.md
```
