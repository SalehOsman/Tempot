# Data Model: Production Delivery Hardening

## Startup Stage

| Attribute | Meaning |
|---|---|
| `stageId` | Stable initializer identifier |
| `required` | Mandatory or optional |
| `status` | Pending, ready, degraded, failed |
| `errorCode` | Non-sensitive typed failure |
| `shutdownOwner` | Component cleanup responsibility |

## Health Signal

| Attribute | Meaning |
|---|---|
| `signalId` | Database, Redis, AI, queue, disk, process |
| `visibility` | Public liveness or restricted readiness |
| `status` | Healthy, degraded, unhealthy, unconfigured |
| `latencyMs` | Safe measured latency |
| `safeDetail` | Non-sensitive operational detail |

## Release Artifact

| Attribute | Meaning |
|---|---|
| `commitSha` | Source commit |
| `imageDigest` | Immutable OCI digest |
| `sbomRef` | SBOM artifact |
| `scanRef` | Vulnerability report |
| `provenanceRef` | Build provenance |
| `signatureRef` | Verifiable signature |
| `runtimeManifestDigest` | Validated runtime metadata |

## Runtime Manifest

Contains only required module/package identities, versions, capability
requirements, locale references, and validation result digests needed at
runtime. It contains no source, tests, or SpecKit documents.

## Migration Compatibility Record

| Attribute | Meaning |
|---|---|
| `migrationId` | Migration set |
| `classification` | Backward-compatible, forward-only, destructive |
| `minimumAppVersion` | Oldest compatible image |
| `rollbackMode` | Image rollback, restore, or forward-fix |
| `backupRef` | Verified backup evidence |
| `approval` | Required approver |

## Deployment Promotion

| Attribute | Meaning |
|---|---|
| `imageDigest` | Exact candidate |
| `environment` | Staging or production |
| `gateEvidence` | Tests, scan, health, migration, smoke |
| `status` | Pending, promoted, blocked, rolled-back, forward-fixed |
| `approvedBy` | Human decision |

## Operational Signal

Metric name, threshold, severity, alert route, fallback alert route, and
runbook reference.
