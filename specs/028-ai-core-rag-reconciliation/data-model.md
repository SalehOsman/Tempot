# Data Model: AI Core RAG Reconciliation

**Feature**: 028-ai-core-rag-reconciliation

## Entities

### AIProviderConfiguration

Represents provider selection for ai-core.

- `providerEnvVar`: `TEMPOT_AI_PROVIDER`
- `allowedProviders`: `gemini`, `openai`
- `defaultProvider`: `gemini`
- `implementationPath`: `packages/ai-core/src/ai-core.config.ts`
- `documentationPath`: `packages/ai-core/README.md`

### ConfirmationResponseKey

Represents the UI-owned translation key returned by `IntentRouter`.

- `key`: `ai-core.confirmation.required`
- `owner`: Bot or UI translation layer
- `returnedFrom`: `IntentRouter.route()`
- `replaces`: English confirmation sentence in package source

### ConfirmationToolStatus

Represents machine-readable status returned from AI SDK tool execution.

- `status`: `confirmation_required`
- `confirmationId`: pending confirmation identifier
- `toolName`: requested tool name

### ReconciliationArtifact

Represents updated documentation that keeps agents aligned with implementation.

- `artifactType`: README, SpecKit spec, SpecKit tasks, roadmap
- `mustRemoveActiveGuidance`: `AI_PROVIDER`, `PROVIDER_REFUSAL`, `AIDegradationMode`
- `mustPreserve`: deferred package boundaries from Spec #027

## Relationships

- `AIProviderConfiguration` is documented by README and implemented by ai-core config.
- `ConfirmationResponseKey` is returned with `requiresConfirmation` metadata.
- `ConfirmationToolStatus` is emitted before tool execution is resumed by confirmation flow.
- `ReconciliationArtifact` references Spec #027 as the parent methodology handoff.
