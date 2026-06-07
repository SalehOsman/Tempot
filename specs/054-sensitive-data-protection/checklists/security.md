# Security Requirements Checklist: Sensitive Data Protection

**Purpose**: Validate security, privacy, migration, and operational requirements  
**Created**: 2026-06-07  
**Feature**: [spec.md](../spec.md)

## Classification and Scope

- [x] CHK001 Is the initial protected-field inventory tied to fields confirmed in the current schema? [Completeness, Spec FR-001]
- [x] CHK002 Are authorized use cases and out-of-scope search modes explicit? [Scope, Spec FR-018/FR-019]
- [x] CHK003 Are database, audit, log, telemetry, backup, and error channels all covered? [Coverage, Spec FR-010/FR-012/FR-021]

## Cryptography and Keys

- [x] CHK004 Is the constitutional AES-256 requirement reflected without exposing key material? [Consistency, Spec FR-002/FR-005]
- [x] CHK005 Are key versioning, backward reads, rotation, and retirement requirements complete? [Completeness, Spec FR-006/FR-007]
- [x] CHK006 Is failure behavior for missing or unknown keys unambiguous? [Clarity, Spec FR-008]
- [x] CHK007 Are lookup tokens explicitly non-reversible and separate from protected payloads? [Security, Spec FR-003]

## Migration and Recovery

- [x] CHK008 Are expand, backfill, verify, cutover, and retirement checkpoints defined? [Completeness, Spec FR-013/FR-014]
- [x] CHK009 Are interruption, resume, duplicate, concurrent-write, and verification-failure scenarios covered? [Coverage, Edge Cases]
- [x] CHK010 Are backup, restore, rollback, and irreversible checkpoints measurable? [Recovery, Spec FR-014]
- [x] CHK011 Does historical audit sanitation preserve useful metadata while removing protected values? [Consistency, Spec FR-011]

## Leakage Prevention

- [x] CHK012 Are exact, nested, serialized, and error-detail representations covered? [Completeness, Spec FR-012]
- [x] CHK013 Do canary criteria prove absence from every named sink? [Measurability, Spec SC-001]
- [x] CHK014 Are migration and key errors required to remain non-sensitive? [Security, Spec FR-015]

## Acceptance and Governance

- [x] CHK015 Is migration completeness quantified at 100% before retirement? [Measurability, Spec SC-002]
- [x] CHK016 Is key rotation demonstrated rather than merely documented? [Acceptance, Spec SC-006]
- [x] CHK017 Are ADR, runbook, independent security review, and reconciliation gates required? [Governance, Spec FR-022/SC-007/SC-008]

## Notes

- No unresolved clarification marker remains.
- Detailed cryptographic and migration requirements are in
  `detailed-specs.md`.
