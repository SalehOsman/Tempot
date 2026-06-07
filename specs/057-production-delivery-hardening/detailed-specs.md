# Detailed Production and Security Specification

## Startup

- Each initializer is named and classified mandatory or optional.
- Mandatory failures block server acceptance and readiness.
- Optional degradation is allowed only when an existing constitutional
  degradation strategy applies.
- Startup errors are mapped to `AppError`, logged once, and followed by ordered
  shutdown.

## HTTP Perimeter

Middleware order:

1. trusted proxy/client identity policy,
2. secure response headers,
3. request/body size enforcement,
4. HTTP rate limiting,
5. content type and webhook secret validation,
6. structured parsing/validation,
7. route behavior,
8. safe error mapping.

Webhook secret comparison remains timing-safe. No browser CORS allowance is
enabled unless an endpoint has an approved browser consumer.

## Health

- `/live` or equivalent: cheap process status only.
- restricted readiness: database, Redis, AI, queue, disk, and startup stages.
- required but unconfigured dependency is not healthy.
- optional unconfigured dependency reports unconfigured/degraded according to
  feature policy.
- thresholds are configurable and default to constitutional limits.

## Runtime Manifest and Image

The builder:

1. validates modules/spec relationships,
2. builds runtime packages,
3. emits a minimal validated runtime manifest,
4. deploys production dependencies,
5. generates Prisma runtime artifacts.

The runner contains only compiled runtime files, production dependencies,
required locale/assets, Prisma schema/client artifacts, and the runtime
manifest. It runs as non-root and uses a read-only filesystem where feasible.

## Supply Chain

For every release candidate:

- dependency audit,
- image vulnerability scan,
- SBOM generation,
- build provenance,
- keyless or approved signature,
- signature verification before deployment,
- immutable digest promotion.

Exceptions are time-bounded, owned, documented, and approved.

## Deployment and Migration

- Staging receives the same digest intended for production.
- Migrations run as a controlled pre-release job.
- Backward-compatible migrations allow image rollback.
- Forward-only/destructive migrations require backup, restore evidence, and a
  forward-fix path.
- Promotion requires smoke tests for health, webhook, database, Redis, queues,
  and graceful shutdown.

## Metrics and Alerts

Required signals:

- HTTP request and Telegram update latency,
- error rate,
- database latency and pool saturation,
- Redis latency/connectivity,
- queue active/waiting/failed counts,
- memory and event-loop lag,
- startup stage outcome,
- webhook denial/rate-limit counts.

Critical alerting cannot depend solely on Telegram. At least one independent
platform/monitoring channel or deployment alert is required.

## Local Compose Safety

- Clearly labeled local-development only.
- Database and Redis host ports bind to loopback or are not exposed.
- Production secrets are not represented by reusable default credentials.
- Production deployment documentation does not recommend local Compose as a
  hardened production topology.
