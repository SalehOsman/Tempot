# 03 - Architecture Analysis

## Architecture Model

Tempot still follows the documented three-layer architecture:

| Layer | Repository area | Responsibility |
| --- | --- | --- |
| Interfaces | `apps/` | Telegram bot, HTTP server, docs app, future frontends. |
| Services | `packages/` | Database, logger, event bus, settings, i18n, storage, AI, queue/cache foundations. |
| Core | `modules/` | Domain/business modules and module-owned behavior. |

The design is appropriate for a production-grade Telegram bot framework and single-bot starter template that must remain SaaS-ready.

## Active Architectural Change: Spec #058

Spec #058 introduces:

- A central Telegram access gate in `apps/bot-server`.
- Explicit bot access modes: `private` and `public`.
- Capability classification for commands, callbacks, and menus.
- A dedicated `modules/membership-management` module.
- User profile creation through the user-management boundary.
- Access-mode controls through settings/admin surfaces.

This architecture is correct in principle: bot-server owns dispatch protection, membership-management owns the domain workflow, and user-management owns profile invariants.

## Open Architectural Risks

### A001 - Event and audit completion

Spec #058 still has open tasks for emitting all membership lifecycle events and writing audit records for access denials, membership state transitions, profile activation outcomes, and access-mode changes. Until these are complete, the architecture is functionally present but observability is incomplete.

### A002 - Concurrent approval idempotency

The data model requires exactly one terminal decision when two administrators review the same request concurrently. The task remains open. This is an architecture and data-integrity requirement, not just a test gap.

### A003 - Architecture documentation drift

`docs/architecture/tempot_architecture.md` is an active source listed by `AGENTS.md`, but its content is heavily corrupted/mojibake and partly Arabic. It should not remain the practical architecture reference in its current form.

### A004 - Roadmap delay versus local active work

The roadmap is correctly conservative: it only records merged progress. However, the local active Spec #058 work is materially ahead of the last roadmap update. This is acceptable before merge but must be reconciled immediately after merge.

## Strengths

- Module boundaries are being respected in the Spec #058 design.
- The access gate is positioned at the correct runtime layer.
- Capability metadata aligns menu visibility with command/callback execution.
- The project already has ADR coverage for navigation, runtime manifests, signed images, and core/cloud boundaries.

## Conclusion

The architecture direction is coherent. The most important architecture work is not redesign; it is completion and reconciliation: finish Spec #058 audit/idempotency/admin-settings slices, then update the architecture spec in English to reflect the real access gate and membership-management boundaries.

