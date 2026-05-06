# Data Model: Deferred Engine Activation

## PackageActivationDecision

| Field | Type | Description |
| --- | --- | --- |
| `decisionDate` | ISO date | Date the Product Manager activated the packages |
| `activatedPackages` | Package name list | Selected packages moved out of Rule XC deferral |
| `remainingDeferredPackages` | Package name list | Packages still deferred |
| `source` | Text | Decision source used by reviewers |

## PackageExecutionSequence

| Field | Type | Description |
| --- | --- | --- |
| `order` | Positive integer | Execution order under Rule LXXXV |
| `packageName` | Package name | Package to implement in that position |
| `precondition` | Text | Required state before the package can start |
| `handoffSpec` | Spec directory | Package SpecKit handoff source |

## PackageHandoffGate

| Field | Type | Description |
| --- | --- | --- |
| `packageName` | Package name | Package being checked |
| `requiredArtifacts` | Artifact list | `spec.md`, `plan.md`, `research.md`, `data-model.md`, `tasks.md` |
| `analysisStatus` | Enum | `pending`, `passed`, or `failed` |
| `specValidateStatus` | Enum | `pending`, `passed`, or `failed` |
| `implementationAllowed` | Boolean | True only after required gates pass |

## Relationships

- One `PackageActivationDecision` owns one `PackageExecutionSequence`.
- Each sequence item requires one `PackageHandoffGate`.
- Package implementation branches are created only after the corresponding
  `PackageHandoffGate` passes.
