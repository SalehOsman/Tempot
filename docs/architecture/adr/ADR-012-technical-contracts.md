# ADR-012: Technical Contracts Registry

**Date:** 2026-03-19
**Status:** Accepted

## Context

Some features require detailed technical specifications beyond a standard `spec.md` — AI integration modes, complex algorithms, advanced security mechanisms. Without a formal requirement, these details get lost or undocumented.

## Decision

Require a `detailed-specs.md` file for any feature that has:

- `hasAI=true` — document AI usage and degradation mode
- A complex algorithm — mathematical definition and edge cases
- Advanced security — encryption mechanism and rate limiting details
- A complex external integration — failure scenarios and retry mechanism

The `detailed-specs.md` must be approved before implementation begins.

## Consequences

- Critical implementation details are captured before coding starts
- AI degradation modes are explicitly chosen, not assumed
- Security mechanisms are reviewed before they are implemented
- Edge cases are documented at specification time, not discovered in production

## Alternatives Rejected

**No formal requirement:** Critical details get added as code comments (if at all) and are never reviewed before implementation.

**Inline in spec.md:** Bloats the spec with technical details that belong in a separate technical contract.
