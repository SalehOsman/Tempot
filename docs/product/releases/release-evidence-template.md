---
title: Release Evidence Template
description: Public release evidence template for bots created from Tempot
tags:
  - release
  - evidence
  - operations
audience:
  - operator
  - super-admin
contentType: developer-docs
difficulty: intermediate
---

# Release Evidence Template

Copy this template for each experimental launch or production release.

## Release Identity

| Field | Value |
| --- | --- |
| Bot name |  |
| Release name or version |  |
| Git commit |  |
| Image digest or build reference |  |
| Environment | `local`, `staging`, or `production` |
| Date |  |
| Operator |  |
| Approver |  |

Do not paste secret values into this record.

## Quality Gates

| Gate | Status | Evidence |
| --- | --- | --- |
| `pnpm install` |  |  |
| `pnpm check` |  |  |
| `pnpm docs:check` |  |  |
| `pnpm template:audit` |  |  |
| Docker startup |  |  |
| Telegram staging smoke |  |  |

## Environment Evidence

| Item | Status | Notes |
| --- | --- | --- |
| `BOT_TOKEN` configured by reference |  | Do not record the value. |
| `DATABASE_URL` configured by reference |  | Do not record the value. |
| `REDIS_URL` configured by reference |  | Do not record the value. |
| `SUPER_ADMIN_IDS` configured |  | Record only that the intended operator is included. |
| Webhook secret configured when required |  | Do not record the value. |
| Readiness token configured when required |  | Do not record the value. |

## Runtime Evidence

| Journey | Status | Evidence |
| --- | --- | --- |
| `/start` |  |  |
| Admin access |  |  |
| Module navigation |  |  |
| Webhook or polling mode |  |  |
| Health endpoint |  |  |
| Readiness endpoint |  |  |
| Backup request |  |  |
| Restore rehearsal |  |  |
| Knowledge answer retrieval |  |  |

## SLO Decision

| Critical journey | SLO state | Action |
| --- | --- | --- |
| Telegram update processing |  |  |
| Webhook delivery |  |  |
| Admin access |  |  |
| RAG answer retrieval |  |  |
| Backup and restore |  |  |

## Rollback Or Forward-Fix

| Field | Value |
| --- | --- |
| Previous known-good release |  |
| Migration compatibility |  |
| Rollback allowed |  |
| Forward-fix owner |  |
| Restore required |  |

## Decision

| Field | Value |
| --- | --- |
| Decision | `go` or `no-go` |
| Reason |  |
| Open exceptions |  |
| Review deadline |  |
