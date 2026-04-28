# Observability Dashboard Scope

**Status**: Future architecture planning artifact for spec #026

## Purpose

Define the future dashboard scope for operational visibility without implementing the dashboard in the current planning slice.

## Dashboard Areas

| Area | Data source | Purpose |
| --- | --- | --- |
| Logs | `packages/logger` | Technical event review |
| Audit events | Audit log repository | User/admin action traceability |
| Errors | Sentry and logger | Error triage |
| Queues | Queue factory/BullMQ | Job status and failures |
| Sessions | Session manager | Session health and cache behavior |
| Event bus | Event bus metrics | Delivery and degradation visibility |
| Modules | Module registry | Enabled/disabled and validation status |
| Bots | Future bot inventory | Managed bot and runtime status |

## Required Guardrails

- Dashboard is a future app surface.
- Access must use auth-core and audit every privileged action.
- No secret values are displayed.
- Tenant and bot scope must be included when Tempot Cloud exists.
- Read-only views should precede operational controls.

## Rollout

1. Define metrics and audit contracts.
2. Add read-only operational API boundaries.
3. Build dashboard app views.
4. Add privileged operations with audit logging.
5. Add SaaS tenant/bot filters when needed.
