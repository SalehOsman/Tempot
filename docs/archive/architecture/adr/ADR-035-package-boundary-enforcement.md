# ADR-035: Package Import Boundary Enforcement

**Status:** Accepted
**Date:** 2026-04-02

## Context

The Tempot monorepo has 10+ packages organized in tiers. Without automated enforcement, developers could accidentally create domain-to-domain imports that violate the architectural boundaries defined in the v11 spec. Manual code review catches these violations but is error-prone and doesn't scale. The project constitution (Rule XV) requires event-driven communication between modules, which implies no direct imports between domain packages.

## Decision

Use `eslint-plugin-boundaries` with ESLint flat config to enforce a four-tier package classification:

| Tier | Classification | Packages | Can Import |
| ---- | -------------- | -------- | ---------- |
| 1 | Foundation | `@tempot/shared` | Nothing (leaf) |
| 2 | Infrastructure | `@tempot/database`, `@tempot/event-bus`, `@tempot/logger`, `@tempot/sentry` | Tier 1 + other Tier 2 |
| 3 | Cross-cutting | `@tempot/i18n-core`, `@tempot/auth-core` | Tier 1 + Tier 2 |
| 4 | Domain | All others (existing + future) | Tier 1 + Tier 2 + Tier 3 (NOT other Tier 4) |

Element types are detected by path pattern: `packages/{name}/**`. The broad pattern (not limited to `src/`) is necessary because `eslint-import-resolver-typescript` resolves workspace package imports to their `dist/` directory (e.g., `@tempot/event-bus` → `packages/event-bus/dist/index.d.ts`). Boundary rules prevent:

1. Tier 1 from importing any @tempot package
2. Tier 2 from importing Tier 3 or 4
3. Tier 3 from importing Tier 4
4. Tier 4 from importing other Tier 4 packages

Future packages default to Tier 4 (domain) unless explicitly classified as infrastructure or cross-cutting.

## Rationale

1. Prevents architectural erosion — violations caught at lint time, not code review
2. Aligns with Constitution Rule XV (event-driven module communication)
3. Zero runtime cost — purely a static analysis check
4. Self-documenting — the ESLint config serves as the authoritative package dependency policy
5. Scales automatically — new domain packages inherit Tier 4 restrictions by default

## Consequences

- All package imports are validated against the tier classification on every lint run
- Requires `eslint-import-resolver-typescript` to resolve `@tempot/*` workspace imports to real file paths (pnpm symlinks would otherwise classify them as external)
- New infrastructure or cross-cutting packages must be explicitly added to the eslint.config.js boundary rules
- Developers see clear lint errors when attempting cross-boundary imports
- The eslint.config.js becomes the single source of truth for package dependency policy
- Structural interface decoupling pattern (ADR-034) remains valid — domain packages use structural interfaces instead of direct imports for cross-cutting concerns like logger and event-bus

## Alternatives Rejected

1. **Manual code review only**: Does not scale, easy to miss violations in large PRs
2. **Custom ESLint rule**: Maintenance burden, eslint-plugin-boundaries is battle-tested
3. **TypeScript project references**: Enforces build order but not import direction — a package can still import anything that compiles
4. **Nx or Turborepo boundary enforcement**: Would require adopting an additional build orchestrator; eslint-plugin-boundaries integrates with existing ESLint setup
