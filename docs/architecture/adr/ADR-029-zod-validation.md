# ADR-029: Zod (Validation)

**Date:** 2026-03-21
**Status:** Accepted

## Context

Tempot requires a robust validation strategy for user inputs, API requests, and internal data structures. Given the framework's strict TypeScript-first architecture, the validation tool must offer first-class TypeScript inference and deep integration with modern development patterns.

## Decision

Use **Zod** as the primary schema definition and validation library.

## Consequences

- Seamless TypeScript type inference directly from schemas.
- Centralized validation logic for API requests and module inputs.
- Ability to provide rich, structured error messages for validation failures.
- Native integration with modern tools like grammY-conversations and Hono.

## Alternatives Rejected

**Joi:** Lacks native TypeScript type inference and requires duplicate type definitions for both schemas and types.

**yup:** Less powerful TypeScript inference and more restrictive in its ecosystem compared to Zod.
