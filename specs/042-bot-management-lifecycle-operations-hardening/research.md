# Bot Management Lifecycle Operations Hardening - Research

**Feature:** 042-bot-management-lifecycle-operations-hardening  
**Generated:** 2026-05-13

---

## Topic 1: Reuse Existing Lifecycle Domain Logic

### Decision

Keep `LifecycleService`, transition contracts, lifecycle repositories, and
events as the only authoritative domain layer for state changes.

### Rationale

The current module already has the transition model, reason policy, history
append, and lifecycle event publication. Handlers should expose that capability,
not reimplement it.

### Rejected Alternatives

- Put transition policy inside callback handlers.
- Build a new lifecycle application service parallel to the existing one.

---

## Topic 2: Lifecycle Reasons Through Input Engine

### Decision

Use `@tempot/input-engine` for pause, maintenance, and archive reason capture.

### Rationale

Spec #041 established that structured bot flows must use the shared package. A
reason prompt is a small structured flow with validation and cancellation
semantics, so it belongs there.

### Rejected Alternatives

- Local one-off text handler.
- Storing pending lifecycle actions in a module-local map.

---

## Topic 3: Archive Confirmation

### Decision

Require an explicit inline confirmation before the archive reason flow begins.

### Rationale

Archive is the most destructive lifecycle operation in this slice. Requiring a
confirm/cancel choice before reason capture reduces accidental invocation while
keeping the flow inline-first.

### Rejected Alternatives

- Immediate archive reason prompt.
- Archive through an ordinary direct action without confirmation.

---

## Topic 4: Scope Boundary

### Decision

Keep this slice limited to lifecycle operations. Notifications, provisioning,
settings, search, and import/export remain separate follow-up features.

### Rationale

The current roadmap identifies multiple unfinished operational areas. Merging
them into one branch would widen verification and blur the production boundary.

### Rejected Alternatives

- Bundle notifier work because lifecycle events already exist.
- Bundle provisioning because lifecycle status affects activation readiness.

---

## Topic 5: Callback UX Shape

### Decision

Lifecycle management should extend the existing callback handler and menu
factory model rather than introduce a new bot entry command.

### Rationale

Spec #041 and the module standard preserve commands as entry points, while
inline menus are the primary navigation surface. Lifecycle belongs under the
bot detail menu, not as a disconnected command-first workflow.

### Rejected Alternatives

- A new command-only lifecycle controller.
- A second callback router outside the module's current handler surface.
