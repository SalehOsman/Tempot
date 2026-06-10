# Feature Specification: Production Delivery Hardening

**Feature Branch**: `codex/057-production-delivery-hardening`
**Created**: 2026-06-07
**Status**: Draft
**Input**: Project audit findings covering startup error-contract gaps, incomplete HTTP hardening, detailed public health output, vulnerable runtime dependencies, oversized runtime images, unsafe Compose defaults, and incomplete supply-chain, promotion, observability, and rollback controls.

## Clarifications

### Session 2026-06-07

- Q: Is the delivery model tied to one cloud provider? -> A: No; define a provider-neutral container release contract for the self-hosted Tempot Core template.
- Q: Is image rollback sufficient when migrations changed data? -> A: No; release compatibility and migration rollback/forward-fix strategy are required.
- Q: Should detailed health diagnostics remain public? -> A: No; public liveness is minimal and detailed readiness is restricted to trusted operational access.
- Q: Are Moderate runtime advisories acceptable by default? -> A: No; runtime advisories require remediation or documented non-exploitability approval.

## User Scenarios & Testing

### User Story 1 - Runtime Starts or Fails Predictably (Priority: P1)

An operator starts Tempot and receives either a fully initialized runtime or a
typed, logged, non-sensitive startup failure before traffic is accepted.

**Why this priority**: Ignored or rejected initializer results can leave startup
outside the declared error contract.

**Independent Test**: Inject failures into i18n, database, Redis, module loading,
and server startup and confirm readiness remains false, traffic is not
accepted, and shutdown is orderly.

**Acceptance Scenarios**:

1. **Given** any mandatory initializer fails, **When** startup runs, **Then** the service does not report ready and exits through the controlled startup path.
2. **Given** an optional degraded dependency, **When** approved degradation applies, **Then** readiness reports degraded state without claiming full health.
3. **Given** startup succeeds, **When** the service becomes ready, **Then** all required initializers and security controls are active.

---

### User Story 2 - HTTP Perimeter Is Secure by Default (Priority: P1)

An operator exposes the webhook and health endpoints without unintentionally
publishing detailed internals or accepting unbounded/unthrottled requests.

**Why this priority**: The current Hono factory lacks an explicit HTTP security
baseline and public health returns internal details.

**Independent Test**: Send oversized, malformed, unauthorized, rate-limited,
and cross-origin requests and verify deterministic secure responses.

**Acceptance Scenarios**:

1. **Given** a public liveness request, **When** it succeeds, **Then** it returns only minimal process status.
2. **Given** an untrusted request for detailed readiness, **When** it is not on the trusted operational path, **Then** internal dependency details are not disclosed.
3. **Given** an oversized or throttled webhook request, **When** it reaches Hono, **Then** it is rejected before expensive processing.
4. **Given** a valid Telegram webhook secret, **When** the request is within policy, **Then** existing webhook behavior remains functional.
5. **Given** Redis is unavailable, **When** a rate-limited protected action is attempted, **Then** the approved bounded fallback or controlled denial applies and the outage is observable.

---

### User Story 3 - Release Artifacts Are Minimal and Verifiable (Priority: P1)

An operator can pull an immutable image and verify its vulnerability status,
SBOM, provenance, signature, non-root execution, and runtime contents.

**Why this priority**: Current publishing creates images without required
supply-chain evidence and copies source/spec trees into the runner.

**Independent Test**: Build the image from a clean commit, scan it, inspect its
contents and user, verify its signature/attestations, and run a smoke test.

**Acceptance Scenarios**:

1. **Given** a release commit, **When** CI builds the image, **Then** the artifact is tagged by immutable digest/SHA and has SBOM, provenance, and signature.
2. **Given** a vulnerable runtime dependency above policy, **When** the image is scanned, **Then** publication or promotion is blocked.
3. **Given** the runner image, **When** its filesystem is inspected, **Then** it contains compiled runtime artifacts and generated manifests, not full source or SpecKit trees.
4. **Given** the container starts, **When** runtime identity is inspected, **Then** it runs as non-root.

---

### User Story 4 - Deployment Is Observable and Reversible (Priority: P1)

An operator can promote a tested immutable image, apply compatible migrations,
observe health and SLO signals, and roll back or forward-fix safely.

**Why this priority**: Published images are not equivalent to a controlled
production release.

**Independent Test**: Deploy to staging, apply a compatible migration, run
smoke/health checks, promote, inject a failure, and execute the documented
rollback or forward-fix path.

**Acceptance Scenarios**:

1. **Given** a release candidate, **When** staging gates pass, **Then** the same immutable digest is promoted.
2. **Given** an incompatible or failed migration, **When** deployment evaluates compatibility, **Then** promotion stops.
3. **Given** a post-deploy health or SLO failure, **When** rollback policy triggers, **Then** the operator can restore the prior compatible application state.
4. **Given** a Redis, database, queue, or AI degradation, **When** it occurs, **Then** metrics and alerts distinguish degraded from healthy operation.

### Edge Cases

- i18n initialization rejects instead of returning an error result.
- AI or queue provider is not configured but health reports OK.
- Redis fails while bot rate limiting is active.
- A webhook body is valid JSON but not a valid Telegram update.
- Proxy headers contain untrusted client IP data.
- Image scanning service is unavailable.
- Signature verification fails after successful build.
- Migration is forward-only and the previous image cannot use the new schema.
- Health checks overload a failing dependency.
- Disk threshold differs by deployment size.
- Compose is accidentally run on a public host.
- Alert delivery through Telegram fails during a Telegram outage.

## Requirements

### Functional Requirements

- **FR-001**: Mandatory initializers MUST be awaited, validated, and mapped into the declared startup error contract.
- **FR-002**: The service MUST NOT accept webhook traffic or report readiness before all mandatory initialization succeeds.
- **FR-003**: Approved optional dependency degradation MUST be explicit and MUST NOT be reported as fully healthy.
- **FR-004**: Startup failures MUST be logged once with non-sensitive structured evidence and complete graceful shutdown.
- **FR-005**: Public liveness MUST expose only minimal process status.
- **FR-006**: Detailed readiness MUST be restricted to trusted operational access and report healthy, degraded, or unhealthy dependencies accurately.
- **FR-007**: HTTP responses MUST apply an approved secure-header baseline.
- **FR-008**: HTTP request bodies MUST have explicit size limits before expensive parsing or processing.
- **FR-009**: Webhook requests MUST retain timing-safe secret validation and receive HTTP-layer rate limiting.
- **FR-010**: CORS behavior MUST be explicit; endpoints without browser clients MUST not enable permissive cross-origin access.
- **FR-011**: HTTP error responses MUST avoid internal exception details and use stable machine-readable categories.
- **FR-012**: Runtime dependency advisories at or above the approved policy MUST block release unless exploitability is reviewed and an explicit time-bounded exception is approved.
- **FR-013**: Confirmed Hono, `qs`, `uuid`, and AI provider utility advisories from the 2026-06-07 audit MUST be upgraded or dispositioned.
- **FR-014**: Production images MUST run as non-root and use immutable or digest-pinned base/release references.
- **FR-015**: Runner images MUST exclude full source, tests, and SpecKit trees; runtime module validation MUST consume a build-time generated manifest.
- **FR-016**: Every release image MUST have an SBOM, vulnerability report, provenance attestation, and verifiable signature.
- **FR-017**: Image promotion MUST use the exact immutable digest validated in staging.
- **FR-018**: Development Compose MUST bind data services safely for local use, clearly identify itself as non-production, and avoid production-like ambiguity.
- **FR-019**: Production deployment guidance MUST define secrets, TLS, database/Redis network isolation, migrations, backups, health checks, and shutdown.
- **FR-020**: Deployment MUST classify every migration as backward-compatible, forward-only, or destructive before promotion.
- **FR-021**: Rollback plans MUST account for application/schema compatibility and use forward-fix when image rollback is unsafe.
- **FR-022**: Staging MUST execute migration, container smoke, webhook, liveness/readiness, and graceful-shutdown tests before promotion.
- **FR-023**: Runtime MUST expose metrics for request/update latency, error rate, database latency/pool, Redis latency, queue activity, memory, and event-loop health.
- **FR-024**: Health and alerting MUST not claim OK for unconfigured required providers.
- **FR-025**: Alert delivery MUST have a fallback path that does not depend solely on the failing Telegram runtime.
- **FR-026**: Operational thresholds MUST be configurable and aligned with constitutional performance thresholds.
- **FR-027**: Backup/restore and release rollback or forward-fix MUST be rehearsed before production approval.
- **FR-028**: Production readiness requires zero open Critical findings and no unapproved High runtime/security findings.
- **FR-029**: Redis-backed rate-limiter failure behavior MUST be explicit; protected or high-cost actions MUST NOT silently become unlimited, and the fallback or controlled denial MUST be observable.

### Key Entities

- **Startup Stage**: Required/optional initializer, outcome, degradation rule, and shutdown responsibility.
- **Health Signal**: Liveness/readiness check, visibility, status, latency, and safe detail.
- **Release Artifact**: Immutable image digest plus SBOM, scan, provenance, and signature.
- **Runtime Manifest**: Build-time validated module/package metadata required by the runner.
- **Migration Compatibility Record**: Schema/data change classification and rollback/forward-fix policy.
- **Deployment Promotion**: Candidate digest, environment, gate evidence, approver, and outcome.
- **Operational Signal**: Metric, threshold, alert route, and runbook.

## Success Criteria

- **SC-001**: Every injected mandatory startup failure prevents readiness and traffic acceptance.
- **SC-002**: Public liveness responses contain no dependency names, error strings, versions, or secrets.
- **SC-003**: Oversized, malformed, invalid-secret, and throttled HTTP requests are rejected before bot processing.
- **SC-004**: Runtime dependency scan contains zero unapproved High or Moderate advisories in production-reachable packages.
- **SC-005**: Runner image contains no full `specs/`, source test trees, or unnecessary workspace source directories.
- **SC-006**: Every promoted image has verified SBOM, provenance, signature, and immutable digest.
- **SC-007**: Staging deploy, migration, smoke, graceful shutdown, and rollback/forward-fix rehearsal pass using the promotion artifact.
- **SC-008**: Health and metrics distinguish healthy, degraded, unconfigured, and unavailable dependency states.
- **SC-009**: Alert failure on the Telegram path is observable through a separate configured channel or platform signal.
- **SC-010**: Zero Critical and no unapproved High production-readiness findings remain.
- **SC-011**: A Redis outage test proves that protected/high-cost rate limits use the approved bounded fallback or controlled denial and emit an operational signal.

## Assumptions

- Tempot Core remains a self-hosted single-bot template.
- Docker/GHCR remain supported artifact mechanisms.
- Deployment provider details are supplied by adopters, while the release
  contract remains provider-neutral.
- Existing webhook secret validation is retained.
- A future SaaS control plane is outside this feature.

## Out of Scope

- Selecting a mandatory cloud provider.
- Building the future Dashboard or Mini Apps.
- Multi-region active-active deployment.
- Tenant billing or fleet management.
- Replacing GitHub Actions.
