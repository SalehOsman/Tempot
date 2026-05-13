# Research: Bot Developer Runtime Observability

## Decision 1: Development restart strategy

Use auto rebuild plus process restart for development. The bot loads modules from `dist`, so source changes in `modules/*/src` and `packages/*/src` must be compiled before the bot process can consume them.

**Rejected alternative:** In-process hot module replacement. This is riskier for grammY conversations, session state, and dynamic module registration.

## Decision 2: Dependencies

Prefer existing workspace tooling: `pnpm`, `tsx`, `tsc`, and Node.js runtime APIs. A new watcher dependency is not justified until the built-in approach proves insufficient.

## Decision 3: Interaction observability

Add middleware-level structured logging around grammY updates and a callback fallback after module handlers. This complements the existing audit middleware and error boundary without changing persistence semantics.

## Decision 4: Flow observability

Input-engine already receives a logger dependency. Field lifecycle logging should live inside the runner and field processor because those files know the form, field, retry, and control-action context.

## Decision 5: Conversational callback acknowledgement

Inline-button acknowledgements produced from inside grammY conversations must call the conversational callback context directly and remain timeout-bounded in the input engine. Wrapping `answerCallbackQuery` inside `conversation.external` is not appropriate because Telegram API calls are already part of the conversations replay model, while `external` is reserved for outside side effects.
