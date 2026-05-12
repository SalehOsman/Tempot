# Module Capability Reuse Standard

**Status**: Authoritative developer standard for Tempot modules
**Audience**: Developers and agents specifying, planning, implementing, and reviewing modules.
**Applies to**: Every module under `modules/`, every SpecKit plan for a module,
and every code review that decides whether functionality should reuse an
existing package or be implemented locally.

## Purpose

Tempot packages exist so modules do not repeatedly rebuild the same technical
capabilities. Modules own product behavior and domain rules. Packages own
shared, reusable capabilities such as input flows, Telegram UX primitives,
search, settings, notifications, storage, imports, exports, AI, authorization,
logging, events, and persistence foundations.

This standard makes that boundary explicit:

1. Reuse approved packages by default.
2. Compose package capabilities before creating a new local abstraction.
3. Extend a package only when the capability is reusable beyond one module.
4. Implement a local custom pattern only by documented exception.

The goal is not to block legitimate domain-specific behavior. The goal is to
prevent avoidable duplication, inconsistent flows, and hidden maintenance cost.

## Core Rule

Every material capability in a module must be classified in planning and review
as one of:

| Classification | Meaning |
| --- | --- |
| `Reuse` | Use an approved package directly with no local replacement. |
| `Compose` | Use one or more approved packages with module-owned schemas, adapters, data sources, or orchestration. |
| `Extend Package` | Add or improve reusable package functionality because the gap belongs in shared infrastructure. |
| `Custom Approved` | Implement locally because reuse or package extension is not appropriate for the current requirement. |

`Custom Approved` is an exception path, not a convenience path.

## Decision Ladder

Use this decision sequence for every meaningful module capability:

1. **Is there an approved package for this capability?**
   - If no, move to step 4.
   - If yes, continue.
2. **Does the package cover the requirement directly?**
   - If yes, classify as `Reuse`.
3. **Can the requirement be satisfied by composing the package with module-owned
   schema, adapter, renderer, query source, callback mapping, or configuration?**
   - If yes, classify as `Compose`.
4. **Is the missing capability reusable across modules and aligned with the
   package's responsibility?**
   - If yes, classify as `Extend Package`.
5. **Would package reuse or extension distort ownership, over-generalize a
   domain-specific rule, or delay a justified local requirement without adding
   durable value?**
   - If yes, classify as `Custom Approved`.

## Mandatory Planning Table

Every `plan.md` for a new module, or for a major module expansion, must include
a capability decision table.

Recommended format:

| Capability Need | Default Package | Decision | Rationale | Follow-up |
| --- | --- | --- | --- | --- |
| Multi-step bot creation flow | `@tempot/input-engine` | `Reuse` | Built for structured Telegram forms and validation. | None |
| Admin list navigation | `@tempot/ux-helpers` | `Compose` | Module owns labels and callbacks; helpers own pagination patterns. | None |
| Template-specific dependency graph | None | `Custom Approved` | Domain-specific orchestration, not a reusable package concern. | Revisit only if a second module needs the same graph behavior. |

The table must be concrete. Entries such as "custom because easier" or "reuse
later" are not valid.

## Mandatory Review Questions

Reviewers must ask:

1. Did the plan identify the approved package for every reusable capability?
2. Was a package ignored even though it already solves the problem?
3. Could the local implementation be a schema, adapter, renderer, or data source
   around an existing package instead?
4. If a package gap exists, is it actually reusable and therefore a package
   extension candidate?
5. If local custom logic was chosen, is the exception rationale documented and
   technically coherent?

## Package Capability Matrix

| Need | Required Default | What the Module Should Not Rebuild |
| --- | --- | --- |
| Multi-step input flows, wizards, structured Telegram forms | `@tempot/input-engine` | Manual conversation state machines, ad hoc step maps, repeated validation loops, custom cancel/back/resume handling |
| Telegram buttons, callback UX, pagination, confirmations, status messaging | `@tempot/ux-helpers` | Repeated button layout utilities, callback safety wrappers, pagination widgets, standard feedback messages |
| Authorization and role checks | `@tempot/auth-core` | Local role hierarchy, custom permission engines, duplicated RBAC rules |
| Repository foundation and shared persistence patterns | `@tempot/database` | Direct Prisma usage in services, local transaction helpers that duplicate package behavior |
| Cross-module events | `@tempot/event-bus` | Direct module imports, custom in-memory pub/sub between modules |
| User-facing translation | `@tempot/i18n-core` | Hardcoded strings, local translation loaders |
| Editable or protected content surfaces | `@tempot/cms-engine` | Local dynamic text registries, placeholder validation clones |
| Runtime and module settings | `@tempot/settings` | Ad hoc config stores, local settings persistence abstractions |
| Notifications and notification request workflows | `@tempot/notifier` | Direct notification delivery logic inside modules |
| Search, filtering, query state, search-oriented pagination | `@tempot/search-engine` | Local generic filter engines, repeated search state implementations |
| Import parsing, validation batches, invalid-row reporting | `@tempot/import-engine` | CSV/Excel parsers and repeated import job coordination |
| Exports and generated documents | `@tempot/document-engine` | Local PDF/Excel generation pipelines for supported document outputs |
| File storage and attachment handling | `@tempot/storage-engine` | Direct provider SDK usage or local upload/download abstractions |
| AI provider usage, RAG, grounding, audit-oriented AI behavior | `@tempot/ai-core` | Direct provider orchestration, local RAG pipelines, ungrounded AI flows |
| Module metadata, activation, command registration contracts | `@tempot/module-registry` | Local registry copies, duplicate enable/disable discovery logic |
| Logging and audit-capable log surfaces | `@tempot/logger` | Ad hoc logger wrappers or production `console.*` calls |
| Shared errors, `Result`, cache wrapper, queue factory, shutdown helpers | `@tempot/shared` | Local equivalents of existing foundational primitives |

## Telegram Interaction Standard

For Telegram-facing modules, the preferred operating model is:

1. **Commands are entry points.**
   - Commands open a managed view or launch a guided flow.
   - Commands should not become large one-shot execution paths when a reusable
     guided flow is appropriate.
2. **Inline menus are the primary navigation surface.**
   - Use inline buttons for browsing, selecting, confirming, paging, drilling
     into detail views, and returning to previous surfaces.
3. **`@tempot/input-engine` is the default for structured data collection.**
   - Use it for create/edit forms, settings updates, search criteria forms, and
     other multi-field flows.
   - Prefer built-in field types before building local handlers.
4. **Free-text input is used only when the field type requires it.**
   - Text entry remains valid for names, descriptions, tokens, notes, URLs,
     search queries, and other genuinely free-form data.
5. **Module handlers orchestrate domain work.**
   - They should not recreate generic form orchestration or generic UX primitives.

## Input Flow Guidance

Use `@tempot/input-engine` when the module needs:

- multi-step creation or edit flows
- input validation and retry handling
- inline-choice fields
- searchable or paginated selection fields
- dates, times, locations, geo selection, toggles, files, or smart extraction
- cancellation, back navigation, confirmation, partial save, or resume

Use `Custom Approved` only when:

- the interaction is not a structured form
- the flow is a domain-specific state machine that cannot be faithfully
  expressed as an input schema plus composition
- extending `input-engine` would be premature or architecturally incorrect

Even then, the custom flow must state why `input-engine` was insufficient.

## Custom Approved Exception Template

Every local custom implementation that bypasses an existing package must be
documented in the feature `plan.md`, and referenced from `tasks.md` when it
creates implementation work.

Use this template:

```markdown
### Custom Capability Exception: {Capability Name}

**Capability gap:**
Describe the exact requirement that is not adequately covered.

**Packages considered:**
- `@tempot/{package-a}` - explain why direct reuse does not fit.
- `@tempot/{package-b}` - explain why composition does not fit, if applicable.

**Why package extension is not selected now:**
State why the gap should not be promoted to shared infrastructure in this feature.

**Approved local pattern:**
Name the pattern to be used, such as local state service, workflow service,
domain-specific transition engine, or purpose-built adapter.

**Required tests:**
List the unit, integration, callback, and regression coverage needed.

**Future extraction trigger:**
State what evidence would justify converting this custom implementation into a
package capability later.
```

## Package Extension Rule

Choose `Extend Package` when:

- the gap is reusable across more than one module
- it fits the package's existing responsibility
- adding it avoids duplicating a pattern in upcoming modules
- the change can be tested and documented as a stable package feature

Package extension work must receive its own:

- SpecKit artifacts when scope is material
- tests at package level
- changelog or changeset when release behavior changes
- downstream module adoption task when relevant

## Examples

### Example 1: Bot Registration Flow

| Need | Decision |
| --- | --- |
| Collect display name, username, token, locale, timezone | `Reuse` `@tempot/input-engine` |
| Confirmation summary before create | `Compose` `@tempot/input-engine` and `@tempot/ux-helpers` |
| Persist resulting bot profile | `Reuse` repository pattern via `@tempot/database` |

Do not build a local `Map`-based form state service if `input-engine` covers the
flow.

### Example 2: Admin Search Surface

| Need | Decision |
| --- | --- |
| Search criteria input | `Reuse` or `Compose` `@tempot/input-engine` |
| Query planning and filtering | `Reuse` `@tempot/search-engine` |
| Paged result navigation | `Compose` `@tempot/ux-helpers` |

Do not duplicate generic filter builders or pagination logic inside the module.

### Example 3: Domain-Specific Approval Workflow

| Need | Decision |
| --- | --- |
| Record approval states and transitions | `Custom Approved` |
| Publish state change events | `Reuse` `@tempot/event-bus` |
| Notify administrators | `Reuse` `@tempot/notifier` |

The approval transition engine may be local if it is unique to one domain, but
notifications and events are still package-owned capabilities.

## Required Documentation Integration

When this standard affects a feature:

- `plan.md` must contain the capability decision table.
- `tasks.md` must include any package extension task or custom exception task.
- README and product docs must reflect the package-backed behavior when relevant.
- ADRs are required only when the capability choice introduces a new architectural
  pattern beyond this standard.

## Developer Completion Checklist

Before asking for review, confirm:

- [ ] Capability decision table exists for new module or major expansion work.
- [ ] Approved packages were selected for all reusable capabilities.
- [ ] `Custom Approved` choices have a completed exception template.
- [ ] Package extension work is not hidden inside a module-only commit.
- [ ] Telegram flows follow commands-as-entry-points and inline-first navigation.
- [ ] Structured multi-step inputs use `@tempot/input-engine` unless an approved
      exception exists.
- [ ] The implementation does not recreate package-owned behavior locally.
