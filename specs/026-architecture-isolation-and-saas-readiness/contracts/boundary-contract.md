# Contract: Architecture Boundary Governance

**Feature**: 026-architecture-isolation-and-saas-readiness  
**Date**: 2026-04-28

This contract defines the expected governance outputs for architecture isolation. It is a documentation and validation contract, not a runtime API.

## Boundary Inventory Contract

The boundary inventory MUST list every active component with:

- Component identifier
- Component type
- Responsibility
- Public contract
- Allowed dependency targets
- Prohibited dependency targets
- Current compliance status
- Remediation reference if not compliant

## Dependency Direction Contract

The dependency model MUST preserve the existing architecture:

```text
apps -> packages -> modules is not the default dependency chain.

apps may orchestrate packages and modules through approved public contracts.
packages may provide reusable services and shared infrastructure.
modules may own business behavior and communicate with other modules through events only.
modules must not import other modules directly.
consumers must not deep-import package internals.
```

## Violation Report Contract

Each finding MUST include:

- Severity
- Source component
- Target component
- Violated rule
- Evidence path
- Recommended remediation
- Whether it blocks implementation

## Merge Gate Contract

The future enforcement gate MUST reject:

- Direct module-to-module imports
- Deep imports from package internals
- Circular dependencies across project boundaries
- Missing public exports for consumed package capabilities
- Shared-code changes without blast radius documentation
- Active specs with missing required artifacts

The gate MAY initially run in report-only mode if the first audit finds too many legacy violations.
