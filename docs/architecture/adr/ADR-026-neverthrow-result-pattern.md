# ADR-026: neverthrow (Result Object Pattern)

**Date:** 2026-03-21
**Status:** Accepted

## Context

Tempot requires a robust, type-safe, and consistent error-handling strategy across the entire monorepo. Standard JavaScript/TypeScript `try-catch` blocks are often inconsistent, lead to "hidden" exceptions that are not tracked by the type system, and make it difficult to force developers to handle failure cases.

## Decision

Use **neverthrow** as the primary library for the **Result Object Pattern** (`Result<T, E>`).

## Consequences

- Errors are treated as values, making failure states explicit in function signatures.
- Type-safe error handling is enforced by the TypeScript compiler; developers must handle the `Err` case.
- Improved readability and composability of asynchronous operations using `.map()`, `.mapErr()`, and `.andThen()`.
- Reduced reliance on global exception handlers and `try-catch` blocks.

## Alternatives Rejected

**Standard Throw/Catch:** Unpredictable, non-exhaustive, and not tracked by TypeScript's type system.

**fp-ts:** Very powerful but has a steep learning curve and high cognitive overhead for developers not familiar with pure functional programming.
