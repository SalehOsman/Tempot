# Contract: Module Flow Governance

## Module Flow Map Contract

Governed modules must expose or document enough information to produce this
review shape:

```json
{
  "moduleName": "help-center",
  "moduleType": "core-platform",
  "entryPoints": ["help"],
  "surfaces": [
    {
      "surfaceId": "help.main",
      "surfaceType": "parent",
      "visibleActions": ["help:commands", "help:support", "menu:main"]
    }
  ],
  "callbackActions": [
    {
      "callbackData": "help:commands",
      "ownerModule": "help-center",
      "targetSurfaceId": "help.commands",
      "actionKind": "navigation",
      "handlerStatus": "handled"
    }
  ],
  "capabilityDecisions": [],
  "exitPaths": ["menu:main"]
}
```

## Readiness Report Contract

Module readiness checks must produce findings that can be consumed by CLI output,
CI summaries, and review prompts:

```json
{
  "moduleName": "help-center",
  "status": "failed",
  "summary": {
    "critical": 1,
    "high": 0,
    "medium": 0,
    "advisory": 1
  },
  "findings": [
    {
      "findingId": "FLOW-001",
      "severity": "critical",
      "surfaceId": "help.commands",
      "callbackData": "help:commands",
      "evidence": "Leaf surface renders the callback that opened it.",
      "correction": "Render parent or main-menu actions instead of the selected leaf callback."
    }
  ]
}
```

## Capability Decision Contract

Module plans and manifests must be reviewable through this shape:

```json
{
  "capabilityNeed": "structured input flow",
  "defaultCapabilityOwner": "approved input flow capability",
  "decision": "Reuse",
  "rationale": "The shared capability covers multi-step input, validation, back, cancel, and retry behavior.",
  "followUp": "None"
}
```

## Grounded Assistant Answer Contract

The module-building assistant must answer with source-backed guidance:

```json
{
  "question": "Which capabilities should a Telegram-facing module reuse?",
  "answer": "Use approved shared capabilities for input flows, Telegram UX, i18n, events, authorization, settings, and AI guidance where applicable.",
  "sources": [
    "docs/developer/module-development-catalog.md",
    "docs/developer/module-capability-reuse-standard.md",
    ".specify/memory/constitution.md"
  ],
  "confidence": "high",
  "blockedActions": [
    "No production code without approved SpecKit artifacts",
    "No bypass of TDD, review, or verification gates"
  ]
}
```
