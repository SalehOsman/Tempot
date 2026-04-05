# Infrastructure: Typed EventBus API + Import Boundary Enforcement — Design

**Date:** 2026-04-02
**Status:** Draft
**Scope:** Two batched tasks: Task A (EventBus type enforcement), Task B (ESLint import boundaries)

---

## Task A: EventBus Type Enforcement

### Problem

The `TempotEvents` type registry exists in `event-bus.events.ts` but provides zero compile-time safety. All `publish()` and `subscribe()` signatures accept `payload: unknown`. The type registry is decorative.

### Design Decisions

#### D1: Module-Augmentable Interface via Declaration Merging

`TempotEvents` is a TypeScript `interface`, which is inherently open for declaration merging. Each package can extend it:

```typescript
// In any package's type file:
declare module '@tempot/event-bus' {
  interface TempotEvents {
    'my-package.entity.action': { id: string };
  }
}
```

The bus API uses **method overloads**:

- When `eventName` matches a key in `TempotEvents`, the payload is constrained to `TempotEvents[K]`
- When `eventName` is an arbitrary `string`, the payload falls back to `unknown`

This approach:

- Provides progressive type safety (registered events are typed, unregistered are not blocked)
- Requires zero runtime changes
- Aligns with YAGNI (Rule V) — no upfront registry of all events needed

#### D2: Compile-Time Only — No Runtime Validation

Runtime Zod validation is YAGNI (Rule V). Compile-time generics ensure publishers send correct shapes. Redis `JSON.parse` loses types at runtime, but the contract is enforced at the publish site. Runtime validation is a separate future concern.

#### D3: EventEnvelope<T> Remains Unused at API Level

`EventEnvelope<T>` exists in `event-bus.contracts.ts` but is not used by any bus implementation. Adding it to the public API would be a breaking change to all consumers for no immediate benefit. Handlers continue to receive raw payloads. The envelope is available for future internal middleware/logging layers.

#### D4: Consumer Adapters Remain as Structural Interfaces (ADR-034)

Per ADR-034, consumer packages define minimal structural interfaces instead of importing `@tempot/event-bus` directly. These adapters are updated to support typed events via generic overloads:

```typescript
// StorageEventBus (storage-engine)
export interface StorageEventBus {
  publish<K extends keyof TempotEvents>(
    eventName: K,
    payload: TempotEvents[K],
  ): AsyncResult<void, AppError>;
  publish(eventName: string, payload: unknown): AsyncResult<void, AppError>;
}
```

Since these are structural interfaces and the consumer packages do NOT import `@tempot/event-bus`, they will reference the payload types directly (e.g., `StorageFileUploadedPayload`) rather than importing `TempotEvents`. The adapters get narrower typed signatures specific to the events they actually publish.

#### D5: Remove 3rd Parameter from cache.service.ts EventBus Interface

The `EventBus` interface in `cache.service.ts` has an incompatible 3-arg signature:

```typescript
publish(event: string, payload: unknown, type: 'LOCAL' | 'INTERNAL' | 'EXTERNAL'): Promise<void>;
```

This is incompatible with all actual EventBus implementations (2-arg). Level routing was never implemented. Decision: **remove the 3rd parameter** and change the return type to `Promise<void>` with 2 args. This is structurally compatible with `EventBusOrchestrator.publish()` since `AsyncResult<void>` (`ResultAsync<void, AppError>`) extends `PromiseLike`. The call site in `fallbackToMemory` already awaits and ignores the result, so no additional changes needed beyond removing the 3rd argument from the call.

#### D6: Missing Events Added to TempotEvents

Two events are published but not in the registry:

- `session.redis.degraded` — published by session-manager
- `system.alert.critical` — published by shared/cache

Both will be added to `TempotEvents` with appropriate payload types.

**Important note:** `session.redis.degraded` has only 2 dot-separated parts, which FAILS `validateEventName()` (requires 3 parts: `{module}.{entity}.{action}`). This is a pre-existing naming convention violation. Since the event name is already in production code and changing it is out of scope for this task, the event will be added to `TempotEvents` as-is. The naming violation should be tracked as a separate cleanup task.

Similarly, `system.alert.critical` has only 2 parts. Same treatment: add to registry, document the naming violation, defer fix.

### Typed API Signature Design

```typescript
// Generic publish — typed when K matches TempotEvents, unknown fallback
publish<K extends string>(
  eventName: K,
  payload: K extends keyof TempotEvents ? TempotEvents[K] : unknown
): AsyncResult<void>;

// Generic subscribe — typed when K matches TempotEvents, unknown fallback
subscribe<K extends string>(
  eventName: K,
  handler: (payload: K extends keyof TempotEvents ? TempotEvents[K] : unknown) => void
): Result<void, AppError> | AsyncResult<void>;

// Generic unsubscribe — same pattern
unsubscribe<K extends string>(
  eventName: K,
  handler: (payload: K extends keyof TempotEvents ? TempotEvents[K] : unknown) => void
): Result<void, AppError>;
```

This approach uses conditional types instead of overloads, which is cleaner and works with a single signature. When `K` is a literal type that's a key of `TempotEvents`, TypeScript narrows the payload type automatically.

### Files to Modify (Task A)

1. `packages/event-bus/src/event-bus.events.ts` — add missing events
2. `packages/event-bus/src/local/local.bus.ts` — typed generic signatures
3. `packages/event-bus/src/distributed/redis.bus.ts` — typed generic signatures
4. `packages/event-bus/src/event-bus.orchestrator.ts` — typed generic signatures
5. `packages/storage-engine/src/storage.interfaces.ts` — typed StorageEventBus
6. `packages/session-manager/src/session.provider.ts` — typed EventBusAdapter
7. `packages/shared/src/cache/cache.service.ts` — fix 3-arg interface
8. `packages/storage-engine/src/storage.service.ts` — update emitEvent to use typed publish
9. `packages/storage-engine/src/jobs/purge.job.ts` — update publish call
10. All test files in event-bus, storage-engine, session-manager, shared that touch publish/subscribe

### Out of Scope

- subscribe() sync vs. async return type inconsistency — separate task
- EventLevel routing implementation — separate task
- Runtime payload validation (Zod) — YAGNI
- EventEnvelope wrapper at the API level
- Fixing event naming convention violations (2-part event names)

---

## Task B: ESLint Import Boundary Enforcement

### Package Classification (Verified Against Dependency Graph)

| Tier | Classification | Packages                                                                    | Can Import                                  |
| ---- | -------------- | --------------------------------------------------------------------------- | ------------------------------------------- |
| 1    | Foundation     | `@tempot/shared`                                                            | Nothing (leaf)                              |
| 2    | Infrastructure | `@tempot/database`, `@tempot/event-bus`, `@tempot/logger`, `@tempot/sentry` | Tier 1 + other Tier 2                       |
| 3    | Cross-cutting  | `@tempot/i18n-core`, `@tempot/auth-core`                                    | Tier 1 + Tier 2                             |
| 4    | Domain         | All others (existing + future)                                              | Tier 1 + Tier 2 + Tier 3 (NOT other Tier 4) |

**Verified against actual dependency graph:**

- `shared` has no @tempot imports ✅
- `database` imports from `shared` ✅ (Tier 2 → Tier 1)
- `event-bus` imports from `shared` ✅ (Tier 2 → Tier 1)
- `logger` imports from `shared` + `database` ✅ (Tier 2 → Tier 1, Tier 2 → Tier 2)
- `i18n-core` imports from `shared` ✅ (Tier 3 → Tier 1)
- `auth-core` imports from `shared` ✅ (Tier 3 → Tier 1)
- `regional-engine` imports from `shared` ✅ (Tier 4 → Tier 1)
- `session-manager` imports from `shared` + `database` ✅ (Tier 4 → Tier 1, Tier 4 → Tier 2)
- `storage-engine` imports from `shared` + `database` ✅ (Tier 4 → Tier 1, Tier 4 → Tier 2)
- `ux-helpers` imports from `shared` + `i18n-core` + `logger` ✅ (Tier 4 → Tier 1, Tier 4 → Tier 3, Tier 4 → Tier 2)
- `sentry` imports from `shared` ✅ (Tier 2 → Tier 1)
- No domain-to-domain imports exist ✅

**Future packages** (all Tier 4 by default):

- `cms-engine`, `input-engine`, `notifier`, `search-engine`, `ai-core`, `document-engine`, `import-engine`

`module-registry` is a placeholder (README only) — classify as Tier 4 for completeness.

### eslint-plugin-boundaries Configuration

- Version: 4.x+ (supports ESLint flat config)
- ESLint version in project: ^10.0.0
- Configuration approach: element types based on package path patterns, rules enforcing tier constraints

### Files to Create/Modify (Task B)

1. **Create:** `docs/architecture/adr/ADR-035-package-boundary-enforcement.md`
2. **Modify:** `eslint.config.js` — add boundary rules
3. **Modify:** Root `package.json` — add `eslint-plugin-boundaries` devDependency

### Verification Strategy

1. Run `pnpm lint` — all existing imports must pass (zero false positives)
2. Add a deliberate violation import, show lint error, revert

---

## Risk Assessment

| Risk                                         | Mitigation                                                    |
| -------------------------------------------- | ------------------------------------------------------------- |
| Generic signature breaks existing test mocks | Tests using `vi.fn()` for handlers will need type annotations |
| module-augmentation pattern unfamiliar       | Document in event-bus README                                  |
| eslint-plugin-boundaries false positives     | Test against actual dependency graph before committing        |
| 2-part event names fail validateEventName    | Out of scope — document as separate cleanup                   |
