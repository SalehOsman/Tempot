# Data Model: Workspace Cleanup

**Feature**: 060-workspace-cleanup
**Date**: 2026-06-24

This spec does not introduce any runtime data model. There is no new database table, no new event, no new in-memory structure. The "data model" here is restricted to the JSON schema of the allowlist entries that are removed or reclassified, plus the structural shape introduced to support the permanent functional-data exemption proposed for FR-005.

## 1. Allowlist Entries Drained or Reclassified

### 1.1 Entries to be removed (4 entries)

| Category           | Pattern                                                                            | Action  | Owner FR |
| ------------------ | ---------------------------------------------------------------------------------- | ------- | -------- |
| `languagePolicy`   | `modules/user-management/abilities.ts`                                              | Delete  | FR-004   |
| `staleArtifacts`   | `apps/bot-server/src/bot-server.types.js`                                          | Delete  | FR-001   |
| `staleArtifacts`   | `modules/user-management/utils/`                                                    | Delete  | FR-002   |
| `eslintDisable`    | `apps/bot-server/scripts/webhook-manager.ts`                                        | Delete  | FR-003   |

After this spec lands, each path above is removed from `scripts/ci/methodology-lint.allowlist.json` in the same commit as the corresponding cleanup.

### 1.2 Entry to be reclassified (1 entry)

| Category           | Pattern                                                                                                  | Action       | Owner FR |
| ------------------ | -------------------------------------------------------------------------------------------------------- | ------------ | -------- |
| `languagePolicy`   | `packages/input-engine/src/fields/numbers/arabic-numerals.helper.ts`                                      | Reclassify   | FR-005   |

The reclassified entry takes the shape defined in Section 2 below.

## 2. Permanent Functional-Data Exemption Shape (proposed)

This shape is new and requires a Spec #059 meta-linter amendment to be accepted. Spec #060 documents the shape and uses it in its own commit; Spec #059's executor adds meta-linter support in a follow-up.

```ts
type FunctionalDataExemptionEntry = {
  pattern: string;                        // glob (POSIX separators), same as standard entries
  reason: string;                         // ≥ 40 characters; MUST mention "functional data" or equivalent
  added_at: string;                       // ISO 8601 date YYYY-MM-DD
  exemption_kind: 'functional-data';      // discriminator; opts out of expires_at requirement
  owner_spec: string;                     // spec slug that approved the permanent exemption
};
```

Differences from the standard `AllowlistEntry`:

- No `expires_at` field. The exemption is permanent until a future spec explicitly removes it.
- New discriminator field `exemption_kind`. When present, the meta-linter MUST skip the 90-day cap check and the expiration check.
- `reason` minimum length is raised from 20 to 40 characters to enforce a higher justification bar for permanent entries.
- `owner_spec` identifies the spec that authorized the permanent exemption.

### Reclassified entry (after this spec lands)

```json
{
  "pattern": "packages/input-engine/src/fields/numbers/arabic-numerals.helper.ts",
  "reason": "Arabic-Indic digit set required by the function's normalization contract; no comments in the file, the Unicode characters are part of the function's input alphabet.",
  "added_at": "2026-06-24",
  "exemption_kind": "functional-data",
  "owner_spec": "060-workspace-cleanup"
}
```

## 3. JSON Schema Delta for `methodology-lint.allowlist.json`

This is a description of the proposed amendment for Spec #059's executor. Spec #060 does NOT itself add this support; it only proposes the shape and uses it once Spec #059 accepts it.

```json
{
  "oneOf": [
    { "$ref": "#/$defs/standardEntry" },
    { "$ref": "#/$defs/functionalDataExemptionEntry" }
  ],
  "$defs": {
    "standardEntry": {
      "type": "object",
      "required": ["pattern", "reason", "added_at", "expires_at", "owner_spec"],
      "properties": {
        "pattern": { "type": "string" },
        "reason": { "type": "string", "minLength": 20 },
        "added_at": { "type": "string", "format": "date" },
        "expires_at": { "type": "string", "format": "date" },
        "owner_spec": { "type": "string" }
      },
      "not": { "required": ["exemption_kind"] }
    },
    "functionalDataExemptionEntry": {
      "type": "object",
      "required": ["pattern", "reason", "added_at", "exemption_kind", "owner_spec"],
      "properties": {
        "pattern": { "type": "string" },
        "reason": { "type": "string", "minLength": 40 },
        "added_at": { "type": "string", "format": "date" },
        "exemption_kind": { "const": "functional-data" },
        "owner_spec": { "type": "string" }
      },
      "not": { "required": ["expires_at"] }
    }
  }
}
```

## 4. File-Level Changes (Inventory)

| Path                                                                            | Change                                                                                                  |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `apps/bot-server/src/bot-server.types.js`                                       | Deleted from local working tree; preventive control added if root cause is reproducible.                |
| `apps/bot-server/scripts/webhook-manager.ts`                                    | Refactored: 90 → ~120 lines split across `main` + `runSet` + `runDelete` + `runInfo`; logger replaces console; eslint-disable removed. |
| `apps/bot-server/tests/unit/scripts/webhook-manager.test.ts`                    | New file; unit tests for the four functions.                                                            |
| `modules/user-management/abilities.ts`                                          | JSDoc translated to English; executable code byte-identical.                                            |
| `modules/user-management/utils/`                                                | Directory removed.                                                                                       |
| `packages/input-engine/src/fields/numbers/arabic-numerals.helper.ts`            | **No change**. File content is correct; only the allowlist entry is updated.                            |
| `scripts/ci/methodology-lint.allowlist.json`                                    | 4 entries removed, 1 entry reclassified to functional-data shape.                                       |
| `scripts/tempot/doctor.ts`                                                       | (Optional, depends on FR-001 outcome) Adds a `stale-bot-server-types-js` health check if Q1 fallback path is taken. |
| `docs/ROADMAP.md`                                                                | Spec #060 row added; status set to "Complete" after merge.                                              |
| `.changeset/060-workspace-cleanup.md`                                            | New changeset entry.                                                                                     |

## 5. Tests Added or Modified

| Test File                                                                     | Why                                                                                  |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `apps/bot-server/tests/unit/scripts/webhook-manager.test.ts`                  | Lock the refactored helpers' dispatch behavior and the `info` field set.            |
| `scripts/tempot/tests/unit/doctor.test.ts` (extension, if FR-001 fallback)   | Verify the doctor check detects the stale artifact and emits the hint.              |

No existing test is modified or weakened.

## 6. Invariants

- The methodology-lint allowlist after this spec lands contains:
  - Zero entries owned by Spec #060.
  - Three entries owned by Spec #061 (the documentation drains).
  - One entry of `exemption_kind: 'functional-data'` (the reclassified `arabic-numerals.helper.ts`).
  - Plus whatever entries Spec #059's meta-linter requires for fixtures or future debt.
- The methodology-lint audit MUST still exit 0 after this spec merges. If it does not, this spec is not done.
- No new runtime dependency. No new devDependency.
- No new error codes; no `EC-NNN` introduced or referenced.
- No measurable NFR targets. The cleanup is qualitative; performance is not at issue.

## 7. Open Items for Spec #059 (Cross-Spec Coordination)

Documented here so the Spec #059 executor sees them in one place:

1. Add support for `exemption_kind: 'functional-data'` per Section 3.
2. Update the meta-linter to skip the `expires_at ≤ added_at + 90 days` rule when `exemption_kind` is present.
3. Update the meta-linter to enforce `reason.length ≥ 40` when `exemption_kind === 'functional-data'`.
4. Update documentation in `docs/developer/methodology-lint.md` (added by Spec #059 T027) to describe permanent exemptions and the approval process (each permanent exemption requires its own spec authorization).
