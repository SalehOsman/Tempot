# Production Readiness Requirements Checklist

**Purpose**: Validate startup, HTTP, image, supply-chain, deployment, and observability requirements  
**Created**: 2026-06-07  
**Feature**: [spec.md](../spec.md)

## Startup and Health

- [x] CHK001 Are mandatory/optional initializer outcomes and traffic activation requirements explicit? [Completeness, Spec FR-001-FR-004]
- [x] CHK002 Are healthy, degraded, unhealthy, and unconfigured states distinguished? [Clarity, Spec FR-003/FR-024]
- [x] CHK003 Are public liveness and restricted readiness requirements separate? [Security, Spec FR-005/FR-006]
- [x] CHK004 Are startup failure and shutdown acceptance criteria measurable? [Acceptance, Spec SC-001]

## HTTP Security

- [x] CHK005 Are headers, body limits, rate limiting, CORS, secret validation, and safe errors all covered? [Completeness, Spec FR-007-FR-011]
- [x] CHK006 Are malformed, oversized, throttled, and unauthorized scenarios defined? [Coverage, Spec SC-003]
- [x] CHK007 Are trusted proxy and cross-origin assumptions explicit? [Edge Case]

## Artifact and Supply Chain

- [x] CHK008 Are runtime dependency advisories and exception policy explicit? [Security, Spec FR-012/FR-013]
- [x] CHK009 Are minimal image contents and runtime manifest requirements measurable? [Acceptance, Spec FR-015/SC-005]
- [x] CHK010 Are SBOM, scan, provenance, signature, and digest promotion all mandatory? [Completeness, Spec FR-016/FR-017]
- [x] CHK011 Is non-root runtime retained? [Consistency, Spec FR-014]

## Deployment and Recovery

- [x] CHK012 Are migration compatibility classes defined? [Clarity, Spec FR-020]
- [x] CHK013 Does rollback distinguish image rollback, restore, and forward-fix? [Recovery, Spec FR-021]
- [x] CHK014 Are staging, smoke, backup/restore, and rehearsal requirements measurable? [Acceptance, Spec FR-022/FR-027]

## Observability

- [x] CHK015 Are required metrics and constitutional thresholds represented? [Completeness, Spec FR-023/FR-026]
- [x] CHK016 Is an alert path independent of Telegram required? [Resilience, Spec FR-025]
- [x] CHK017 Does completion prohibit open Critical and unapproved High findings? [Gate, Spec FR-028]
- [x] CHK018 Is Redis-backed rate-limiter outage behavior explicit and non-silent? [Resilience, Spec FR-029/SC-011]

## Notes

- No unresolved clarification marker remains.
