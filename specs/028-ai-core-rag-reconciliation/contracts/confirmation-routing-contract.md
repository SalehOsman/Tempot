# Contract: Confirmation Routing

**Feature**: 028-ai-core-rag-reconciliation

## IntentResult Confirmation Contract

When a tool requires confirmation and a pending confirmation is created, `IntentRouter.route()` returns:

```json
{
  "response": "ai-core.confirmation.required",
  "toolsCalled": [],
  "tokenUsage": {
    "input": 0,
    "output": 0,
    "total": 0
  },
  "requiresConfirmation": {
    "confirmationId": "conf-123",
    "level": "simple",
    "summary": "Delete a user account"
  }
}
```

Rules:

- `response` is an i18n key, not user-facing prose.
- `requiresConfirmation.confirmationId` is required.
- Existing summary, details, code, and level propagation remains unchanged.

## AI SDK Tool Callback Contract

When a tool callback creates a pending confirmation, it returns:

```json
{
  "status": "confirmation_required",
  "confirmationId": "conf-123",
  "toolName": "delete-user"
}
```

Rules:

- The actual tool execute callback is not called before confirmation.
- The payload is JSON stringified because AI SDK tool callbacks return serializable values.
- The payload is machine-readable and must not contain human-language user guidance.
