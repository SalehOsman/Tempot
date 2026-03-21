# ADR-028: Vitest & Testcontainers (Testing strategy)

**Date:** 2026-03-21
**Status:** Accepted

## Context

Tempot requires a modern, fast, and scalable testing strategy that supports both unit testing of isolated business logic and integration testing of complex services with actual external dependencies (databases, Redis, etc.).

## Decision

Use **Vitest** for unit and integration testing, paired with **Testcontainers** for ephemeral, container-isolated integration environments.

## Consequences

- Faster test execution with Vitest's parallel, HMR-powered test runner.
- Seamless TypeScript integration with native Vite support.
- Consistent and reliable integration tests using Testcontainers to spin up Docker-based dependencies (PostgreSQL, Redis) during CI/CD.
- Reduced developer friction with a Jest-compatible API.

## Alternatives Rejected

**Jest:** Slower startup times, especially in large monorepos, and requires more configuration for modern TypeScript features.

**Mocha:** Lacks modern built-in features (like mocking and code coverage) and requires multiple plugins and manual configuration for TypeScript.
