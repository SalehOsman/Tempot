# ADR-036: EventBus Typed Publish Contracts

**Status:** Accepted
**Date:** 2026-04-02

## Context

The EventBus `publish()` method originally accepted `(eventName: string, payload: unknown)`, providing no compile-time safety. Callers could pass any payload to any event name, and mismatches would only surface at runtime. As the number of cross-module events grew (session updates, storage events, cache alerts), the risk of silent payload mismatches increased.

## Decision

Use TypeScript conditional generics on `publish()` methods with a centralized `TempotEvents` interface as the type registry. Consumer packages define structurally-compatible adapter interfaces with method overloads for their specific events, plus a catch-all `(eventName: string, payload: unknown)` overload for forward compatibility.

**Core mechanism:**

```typescript
publish<K extends string>(
  eventName: K,
  payload: K extends keyof TempotEvents ? TempotEvents[K] : unknown,
): AsyncResult<void>;
```

**Consumer pattern:** Downstream packages (session-manager, shared/cache, storage-engine) define local event bus interfaces with typed overloads matching their events. These are structural subtypes of `EventBusOrchestrator` -- no import-time dependency on `@tempot/event-bus`.

## Consequences

- Payload mismatches caught at compile time
- Backward compatible via catch-all overload
- New events require adding to `TempotEvents` in `event-bus.events.ts` and corresponding overloads in consumer adapters
- Consumer adapters must be kept structurally consistent with `TempotEvents` (manual, not enforced)

## Alternatives Considered

- **Branded types on event names** -- rejected: TypeScript brands don't compose well with string-based event matching
- **Generic class-level type parameter** -- rejected: would require each consumer to parameterize the bus, complicating DI
- **Zod runtime validation** -- rejected: the goal is compile-time safety; runtime validation adds overhead to every publish call
