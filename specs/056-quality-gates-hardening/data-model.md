# Data Model: Quality Gates Hardening

## Test Project

**Fields**:

- `workspaceName`
- `workspacePath`
- `projectType`: app, package, module, or script
- `testKinds`: unit, integration, application, smoke
- `command`
- `required`
- `reportedTestCount`

**Rules**:

- Every governed workspace is represented.
- A required workspace with no executed tests is explicit, not silently omitted.

## Coverage Policy

**Fields**:

- `componentCategory`: service, handler, repository, conversation, other
- `includePattern`
- `excludePattern`
- `threshold`
- `severity`: fail or warn
- `owner`

**Rules**:

- Services: 80% blocking.
- Handlers: 70% blocking.
- Repositories: 60% visible warning.
- Conversations: 50% visible warning.
- App source is included.

## Documentation Freshness Rule

**Fields**:

- `pathPattern`
- `classification`: active or archive
- `sourceOfTruth`
- `checks`
- `exception`

**Rules**:

- Active docs are checked for current claims and valid metadata.
- Archive docs are clearly historical.
- Exceptions are explicit and reviewable.

## Toolchain Baseline

**Fields**:

- `nodeMinimum`
- `nodeCurrent`
- `pnpmVersionPolicy`
- `vitestVersion`
- `coverageProviderVersion`

## Conformance Finding

**Fields**:

- `ruleId`
- `severity`
- `file`
- `line`
- `evidence`
- `remediation`

Findings must be actionable and deterministic.
