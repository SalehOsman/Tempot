# Research: Module Flow Governance

## Decision 1: Incremental Hardening Instead of Rebuilding Modules

**Decision**: Adopt a module-by-module hardening path, starting with one pilot module, rather than recreating all active modules.

**Rationale**: Active modules already represent product behavior. Rebuilding all modules would increase regression risk, blur ownership, and violate the clean-diff and single-responsibility principles. Incremental hardening lets each module receive focused flow checks, tests, documentation, and package reuse review.

**Alternatives considered**:

- **Full module recreation**: Rejected because it creates broad risk and delays usable governance.
- **Only patch current callback bugs**: Rejected because it does not prevent the next module from repeating the pattern.

## Decision 2: Flow Maps as the Review Boundary

**Decision**: Require every governed Telegram-facing module to expose a reviewable flow map that shows entry points, surfaces, callbacks, unavailable actions, role rules, and exits.

**Rationale**: Flow maps are understandable before code review and can be checked against module behavior. They create a shared language for parent pages, leaf pages, action pages, and back paths.

**Alternatives considered**:

- **Rely only on tests**: Rejected because tests prove behavior after implementation but do not help Project Manager and Technical Advisor review the design shape early.
- **Rely only on documentation prose**: Rejected because prose is harder to validate consistently across modules.

## Decision 3: Readiness Findings With Severity

**Decision**: Module readiness checks should report structured findings with severity, evidence, surface, action, and correction guidance.

**Rationale**: Developers need targeted feedback, not a generic failure. Severity lets blockers such as missing handlers be separated from advisory improvements such as diagram clarity.

**Alternatives considered**:

- **Fail-fast with the first error**: Rejected because module authors need the full defect set to plan a cleanup pass.
- **Advisory-only reports**: Rejected because blocking defects must fail before merge.

## Decision 4: Package Reuse Classification as a Gate

**Decision**: Every material module capability must be classified as `Reuse`, `Compose`, `Extend Package`, or `Custom Approved`.

**Rationale**: Tempot packages exist to avoid rebuilding shared infrastructure inside modules. Classification forces each module to explain why it reuses, composes, extends, or locally implements a capability.

**Alternatives considered**:

- **Trust code review to catch duplication**: Rejected because duplication is easier to prevent during planning than after implementation.
- **Forbid all custom behavior**: Rejected because modules still need domain-specific orchestration.

## Decision 5: Grounded Assistant as Developer Aid Only

**Decision**: The AI module builder assistant should answer module creation and review questions from approved project sources, report no-context when evidence is missing, and never generate production code outside the methodology.

**Rationale**: The assistant can speed up module creation, but only if it reinforces the constitution, SpecKit artifacts, package reuse standard, and review gates.

**Alternatives considered**:

- **Runtime module generation assistant**: Rejected for the first slice because it would bypass needed governance and increase risk.
- **Ungrounded general assistant**: Rejected because project authority must come from approved sources.

## Decision 6: Pilot Module First

**Decision**: Use one small Telegram-facing module as the first adoption target before broad rollout.

**Rationale**: A pilot proves the standard, reports, and tests are usable without touching all modules at once.

**Alternatives considered**:

- **Start with the most complex module**: Rejected because complex lifecycle behavior can hide defects in the governance design.
- **Run checks across all modules immediately**: Rejected because a large first report may be noisy before the standard is tuned.
