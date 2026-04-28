# Notifier Requirements Checklist

## Specification Quality

- [x] No `[NEEDS CLARIFICATION]` markers remain.
- [x] Scope is Telegram delivery first with adapter-ready boundaries.
- [x] Public API prohibits raw user-facing text.
- [x] Role and broadcast resolution are delegated to an injected port.
- [x] Blocked-user remediation is event-driven.

## Architecture Quality

- [x] No direct dependency on apps or business modules.
- [x] No direct Prisma delegate usage.
- [x] Queue integration goes through QueueFactory-compatible boundaries.
- [x] Delivery, template rendering, audit, logging, and events are injected ports.
- [x] Package can remain disabled without app startup requirements.

## Testing Quality

- [x] Unit tests cover service validation and queueing.
- [x] Unit tests cover rate policy offsets.
- [x] Unit tests cover processor success and failure paths.
- [x] Unit tests cover Telegram adapter mapping.
- [x] Package-level build and test commands are required before merge.
