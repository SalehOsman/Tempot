# Implementation Plan: Bot Developer Runtime Observability

## Technical Context

- **Runtime**: Node.js 22.12+
- **Language**: TypeScript 5.9.3 strict mode
- **Bot Engine**: grammY 1.41.x
- **Logging**: existing Pino-compatible logger contracts
- **Testing**: Vitest 4.1.0

## Architecture

The feature adds development tooling at the repository root and runtime observability inside existing bot and input-engine boundaries.

- A root development script starts the bot in a watch-friendly mode using existing workspace tooling.
- A bot middleware records command and callback lifecycle events.
- A callback fallback detects callbacks that no module handled.
- Module callback handlers pass unrelated namespaces downstream so shared routing remains authoritative.
- Input-engine field processing emits replay-safe lifecycle logs through the existing injected logger.
- Callback acknowledgement uses the conversational callback context directly and remains timeout-bounded so Telegram acknowledgement delays do not block form flow decisions.
- Startup completion event publishing is best-effort so event-bus delays cannot block polling startup.

## Constitution Check

- No user-facing text in TypeScript files; fallback text uses i18n keys.
- No new dependencies in the initial implementation.
- No production `console.*`.
- Tests precede implementation changes.
- Existing error boundary remains the source of system error reference codes.

## Affected Files

- `package.json`
- `apps/bot-server/src/bot/bot.factory.ts`
- `apps/bot-server/src/bot/middleware/interaction-observer.middleware.ts`
- `apps/bot-server/src/bot/middleware/callback-fallback.middleware.ts`
- `apps/bot-server/locales/ar.json`
- `apps/bot-server/locales/en.json`
- `apps/bot-server/tests/unit/bot.factory.test.ts`
- `apps/bot-server/tests/unit/middleware/interaction-observer.middleware.test.ts`
- `apps/bot-server/tests/unit/middleware/callback-fallback.middleware.test.ts`
- `packages/input-engine/src/runner/field.processor.ts`
- `packages/input-engine/src/runner/callback-response.acknowledger.ts`
- `packages/input-engine/src/runner/conversation-side-effect.runner.ts`
- `packages/input-engine/src/runner/field.lifecycle-logger.ts`
- `packages/input-engine/src/runner/field-validation.feedback.ts`
- `packages/input-engine/tests/unit/callback-response.acknowledger.test.ts`
- `packages/input-engine/tests/unit/field.processor.test.ts`
- `modules/user-management/handlers/callback.handler.ts`
- `modules/user-management/tests/handlers/callback.handler.test.ts`
- `docs/developer/module-capability-reuse-standard.md`

## Verification

Run targeted checks first:

```powershell
pnpm --filter bot-server test -- tests/unit/middleware/interaction-observer.middleware.test.ts tests/unit/middleware/callback-fallback.middleware.test.ts tests/unit/bot.factory.test.ts
pnpm --filter @tempot/input-engine test -- tests/unit/callback-response.acknowledger.test.ts tests/unit/field.processor.test.ts
pnpm --filter bot-server build
pnpm --filter @tempot/input-engine build
```

Run broader gates before merge:

```powershell
pnpm lint
pnpm build
pnpm test:unit
pnpm spec:validate
pnpm cms:check
```
