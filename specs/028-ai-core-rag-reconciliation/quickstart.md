# Quickstart: AI Core RAG Reconciliation

**Feature**: 028-ai-core-rag-reconciliation

## Validate The Slice

1. Run the ai-core unit tests:

```powershell
pnpm --filter @tempot/ai-core test
```

2. Run methodology validation:

```powershell
pnpm spec:validate
```

3. Run lint:

```powershell
pnpm lint
```

4. Run whitespace validation:

```powershell
git diff --check
```

## Manual Review Checklist

- `packages/ai-core/README.md` documents `TEMPOT_AI_PROVIDER`.
- `specs/015-ai-core-package/spec.md` no longer treats `ai-core.provider.refusal` as active required behavior.
- `specs/015-ai-core-package/tasks.md` describes reconciled status instead of obsolete unchecked work.
- `IntentRouter` confirmation output uses `ai-core.confirmation.required`.
- Deferred RAG packages remain deferred.
