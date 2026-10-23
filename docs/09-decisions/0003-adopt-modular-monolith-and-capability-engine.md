# 3. Adopt Modular Monolith, Zero-Role Capabilities, and Domain Extension Model

Date: 2026-10-23

## Status
Accepted

## Context
A generic starter kit must remain domain-agnostic while enabling developers to plug in custom business domains without modifying core platform code or breaking access control.

## Decision
1. **Modular Monolith Layout:**
   - 3-tier hierarchy: `modules/<category>/<module>/slices/<use-case>/`
   - Categories strictly `kernel` (10 invariant modules) and `domain` (business extensions).
2. **Hybrid Role-Based Capability Architecture (RBCA):**
   - Code checks atomic capabilities exclusively via `ctx.can(capability)`.
   - Operators configure dynamic roles and assign capabilities via the Web Admin Dashboard.
3. **Plop CLI Scaffolding:**
   - Developers create new domain modules and slices using `pnpm module:create` and `pnpm slice:create`.

## Consequences
### Positive
- Fully decoupled domain modules.
- Zero codebase modification required when creating new roles or capabilities.
