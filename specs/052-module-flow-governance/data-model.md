# Data Model: Module Flow Governance

## Module Flow Map

Represents the reviewable interaction model for one module.

**Fields**:

- `moduleName`: Stable module identifier.
- `moduleType`: Catalog type such as core platform, operational, product, integration, or example.
- `entryPoints`: Command or menu entry points that open the module.
- `surfaces`: Interaction surfaces owned by the module.
- `callbackActions`: Inline callback actions visible or handled by the module.
- `capabilityDecisions`: Capability decisions associated with the module.
- `roleRules`: Visibility and permission rules that affect surfaces or actions.
- `exitPaths`: Back, cancel, parent, and main-menu paths.
- `version`: Flow map version for review and drift detection.

**Validation rules**:

- Every visible callback must map to an owning handler, unavailable response, or documented omission rule.
- Every leaf surface must expose a return path and must not repeat the opening callback unless the action changes state.
- Every unavailable action must have localized user feedback.

## Interaction Surface

Represents a user-visible state in a module interaction.

**Fields**:

- `surfaceId`: Unique identifier within the module.
- `surfaceType`: Main, parent, leaf, action, confirmation, result, or unavailable.
- `titleKey`: Localized title or heading key when visible.
- `visibleActions`: Callback actions rendered on the surface.
- `openedBy`: Entry point or callback that opens the surface.
- `roleVisibility`: Roles or permissions allowed to see the surface.

**Validation rules**:

- Surface identifiers are unique within a module.
- Leaf surfaces cannot render their own opening callback unless the action is state-changing.
- Visible labels must be backed by required locale keys.

## Callback Action

Represents an inline user action.

**Fields**:

- `callbackData`: Callback data or namespace pattern.
- `ownerModule`: Module that owns the action.
- `targetSurfaceId`: Surface reached by the action.
- `actionKind`: Navigation, state change, unavailable, confirmation, or exit.
- `handlerStatus`: Handled, unavailable, omitted, or stale-safe.
- `labelKey`: Localized button label key when visible.

**Validation rules**:

- Callback namespace must match the owning module convention.
- Visible actions must be handled or explicitly unavailable.
- Unrelated namespaces must pass through to downstream handling.

## Capability Decision

Represents a module planning decision for one material capability.

**Fields**:

- `capabilityNeed`: Module need being satisfied.
- `defaultCapabilityOwner`: Approved shared capability or none.
- `decision`: Reuse, Compose, Extend Package, or Custom Approved.
- `rationale`: Reason the decision fits the module.
- `followUp`: Required package extension, documentation, or future extraction trigger.

**Validation rules**:

- Custom Approved decisions require a complete exception.
- Extend Package decisions require package-level tasks and downstream adoption tasks.
- Reuse and Compose decisions must not duplicate shared capability behavior locally.

## Custom Capability Exception

Represents the exception record required before local custom capability work.

**Fields**:

- `capabilityGap`: Exact requirement not covered by approved capabilities.
- `packagesConsidered`: Approved capabilities reviewed and why they do not fit directly.
- `extensionDecision`: Why package extension is or is not selected.
- `approvedLocalPattern`: Named local pattern allowed for this feature.
- `requiredTests`: Unit, integration, callback, or regression tests required.
- `futureExtractionTrigger`: Evidence that would justify moving the behavior into a package later.

**Validation rules**:

- Empty or convenience-based rationales are invalid.
- Required tests must appear in tasks before implementation.

## Readiness Finding

Represents a module governance report item.

**Fields**:

- `findingId`: Stable finding identifier.
- `severity`: Critical, high, medium, or advisory.
- `moduleName`: Affected module.
- `surfaceId`: Affected surface when known.
- `callbackData`: Affected callback when known.
- `evidence`: Concise explanation of the detected issue.
- `correction`: Recommended correction path.

**Validation rules**:

- Critical findings block handoff or merge.
- Advisory findings do not block but must be visible in the report.

## Grounded Assistant Answer

Represents a developer-assistant response.

**Fields**:

- `question`: Developer question.
- `answer`: Grounded recommendation.
- `sources`: Approved source references used to answer.
- `confidence`: High, medium, low, or no-context.
- `blockedActions`: Methodology steps the assistant must not bypass.

**Validation rules**:

- No-context answers must not recommend unverified project authority.
- Assistant output must not replace Product Manager approval, SpecKit, TDD, review, or verification gates.
