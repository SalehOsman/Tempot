---
title: SLO Catalog
description: Public service-level objectives and operational expectations for Tempot bot deployments.
tags:
  - operations
  - slo
  - reliability
audience:
  - bot-developer
  - operator
contentType: developer-docs
difficulty: intermediate
---

# SLO Catalog

This catalog defines the operational targets a bot created from Tempot should
meet before it serves real users. The values below are template defaults. A
production bot may tighten or relax them based on its business requirements.

## Service Scope

The runtime service is implemented by `apps/bot-server`. It exposes the
Telegram bot runtime, webhook or polling integration, and HTTP health endpoints.
The data layer uses `packages/database`, PostgreSQL, Prisma, Drizzle, and
pgvector foundations. Redis-backed capabilities are configured through the
runtime environment and supporting packages.

## Default Objectives

| Area | Objective | Measurement | Evidence |
| --- | --- | --- | --- |
| Bot availability | 99.0% during experimental launch | Successful bot runtime process and Telegram interaction checks | Health checks, deployment logs, smoke test notes |
| Health endpoint | Responds within 1 second under normal local load | HTTP request to the configured health endpoint | Manual or automated health probe output |
| Database readiness | Migrations are applied before serving users | Migration command result and runtime startup logs | Release evidence template |
| Redis readiness | Redis URL is configured when Redis-backed features are enabled | Runtime startup logs and feature smoke tests | Release evidence template |
| Error visibility | Unexpected runtime errors are logged with enough context to triage | Structured logs and, when configured, Sentry events | Operator log sample |
| Backup readiness | Backup and restore flows are verified before production launch | Backup artifact and restore verification result | Backup release evidence |

## Launch Levels

### Experimental Launch

Experimental launch is acceptable when:

- `pnpm check` passes locally.
- `pnpm docs:check` passes locally.
- `pnpm template:audit` passes locally.
- Required values in `.env` are configured.
- The bot starts and responds to a controlled Telegram smoke test.
- The operator accepts temporary risk for known non-critical findings.

### Production Launch

Production launch requires additional evidence:

- CI passes on the release commit.
- Dependency audit findings are triaged.
- Database migration and rollback procedure is documented.
- Backup and restore have been tested against a non-production database.
- Monitoring, alert ownership, and escalation contacts are documented.
- At least one release evidence record is completed.

## Operational Evidence

Use `docs/product/releases/release-evidence-template.md` for every launch or
major upgrade. Do not include secrets, access tokens, private keys, database
dumps, or personally identifiable information in evidence files.

## Review Cadence

Review these objectives before every template release and after any change to:

- `apps/bot-server`
- `packages/database`
- `packages/backup-engine`
- `packages/logger`
- `packages/sentry`
- `docker-compose.yml`
- `.env.example`
