# Research: Comprehensive Documentation Audit

## Decision: Treat Deferred Packages as Informational

Rule XC states that packages formally marked as not started or deferred in the roadmap are exempt from the Reconciliation Gate until they enter active execution.

**Rationale**: Deferred packages may intentionally contain incomplete planning artifacts or references to planned files. Reporting them as blocking failures makes `pnpm spec:validate` noisy and hides active drift.

**Outcome**: All-package validation should exclude roadmap-deferred packages from blocking reports. Individual validation for a deferred spec remains available when needed.

## Decision: Audit Specs Still Need Artifacts

Audit specs are not runtime features, but they still live under `specs/` and are consumed by the same validation tooling.

**Rationale**: Complete artifacts keep the specification tree consistent and prevent false CRITICAL failures.

**Outcome**: This audit spec includes minimal plan, tasks, research, and data-model artifacts that explicitly document its audit-only nature.
