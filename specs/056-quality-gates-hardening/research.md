# Research: Quality Gates Hardening

## Decision 1: One Canonical Root Test Inventory

**Decision**: Root Vitest workspace configuration and canonical scripts account
for every governed app, package, module, and script project.

**Rationale**: CI commands must not silently omit applications.

**Alternatives considered**:

- **Keep explicit CI commands only**: Rejected because local root commands
  would remain misleading.
- **Run every package script recursively without inventory**: Rejected because
  testless or misconfigured projects can still disappear silently.

## Decision 2: Fix Interaction Trace Fixtures at the Public Contract

**Decision**: Repair the two failing bot-server tests by creating traces through
the public interaction-observability helpers or by providing the complete
required shape, not by weakening runtime validation.

**Rationale**: The trace contract correctly requires `eventCount`; the tests
manually inject stale incomplete objects.

## Decision 3: Component Coverage Policies

**Decision**: Map source files to constitutional categories and enforce
blocking/warning thresholds per component, with apps included.

**Rationale**: Aggregate percentages do not represent architectural risk.

**Alternatives considered**:

- **Raise global threshold only**: Rejected because high-coverage packages can
  continue masking weak services/handlers.

## Decision 4: Root-Owned Documentation Commands

**Decision**: Add canonical root scripts and make docs scripts discover the
repository root from a stable anchor rather than process working directory.

**Rationale**: Package-manager script working directories differ from root
assumptions.

## Decision 5: Explicit Active/Archive Policy

**Decision**: Freshness checks apply to active documentation; archives are
validated for structure and historical labeling but not current-state claims.

**Rationale**: Historical records should not be rewritten, but they must not be
mistaken for active guidance.

## Decision 6: Pin Toolchain Through Manifest and CI Matrix

**Decision**: Add the approved `packageManager` metadata, align coverage
provider exactly with Vitest, and test minimum/current Node versions.

**Rationale**: Direct pnpm and Corepack currently resolve different majors.

## Decision 7: Extend Existing Audits

**Decision**: Add source policy detection to existing CI scripts where the rule
fits, keeping production source and tooling-script exceptions explicit.

**Rationale**: A second disconnected lint framework would increase drift.
