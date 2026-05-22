# Research: bot-interaction-observability

## Decision: Use Existing AuditLog Instead Of New Tables

The current `AuditLog` model already supports `action`, `module`, `targetId`, `before`, `after`, and `status`. Interaction observability can store trace metadata in `after` without schema churn.

## Decision: Keep Full Interaction Telemetry In Technical Logs

Pino logs are the fastest path for operational diagnosis in Docker and CI logs. Audit persistence is used for important outcome metadata, while high-volume response events remain technical logs.

## Decision: Use Context-Bound Trace Metadata

grammY middleware receives the same context object through the request chain. Storing a typed trace object on that context lets observer, audit, and error boundary share trace data without global state.

## Rejected Alternative: New Observability Package

A new package would add release and package checklist overhead before the runtime has proven the minimum data contract. The first implementation stays in `bot-server` and can be extracted later if needed.
