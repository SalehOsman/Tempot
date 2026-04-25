# Tempot Constitution

## Core Principles

### I. TypeScript Strict Mode

TypeScript `strict: true` is mandatory. No `any` types. STRICTLY PROHIBITED: Using @ts-ignore, @ts-expect-error, or eslint-disable to bypass type or lint errors.

### II. Code Limits (ESLint enforced)

- Maximum 200 lines per file
- Maximum 50 lines per function
- Maximum 3 parameters per function
- Enforced via ESLint rules — build fails on violation

### III. File Naming Standards

- **Folders:** `kebab-case` (e.g. `user-management/`)
- **Files:** `{Feature}.{type}.ts` (e.g. `user.service.ts`, `invoice.handler.ts`)
- **BANNED filenames:** `utils.ts`, `helpers.ts`, `misc.ts`, `common.ts` — every file must have a descriptive, domain-specific name

### IV. Conventional Commits

Mandatory commit format enforced via commitlint:

- `feat(module):` — new feature → MINOR version
- `fix(module):` — bug fix → PATCH version
- `feat!:` or `BREAKING CHANGE:` → MAJOR version
- `docs:`, `chore:`, `test:`, `refactor:`, `security:`

### V. Simplicity Over Cleverness

YAGNI strictly enforced. Start simple, add complexity only when proven necessary. No premature abstractions.

### VI. No Hardcoded Values

All configuration in `.env` or DB settings. No magic numbers or strings in code. Every value that could change must be externalized.

### VII. Fix at Source

When fixing bugs, AI tools MUST fix the actual defective code — NOT add wrapper code, workarounds, or patches around it. No "code to fix code". The root cause must be corrected in the original function/line. Workaround code (extra try/catch, defensive if-checks, wrapper functions) that masks the original bug is FORBIDDEN.

### VIII. No Zombie Code

No dead or commented-out code. All unused code MUST be deleted, not commented. Git history preserves everything. Commented code in PRs is rejected.

### IX. Single Responsibility per Change

One fix = one concern. AI tools MUST NOT "while I'm here" fix unrelated issues in the same commit. Each commit addresses exactly one issue.

### X. No Silent Failures

No empty catch blocks. No swallowed errors. Every catch must either: log the error, return `Result.err()`, or re-throw. Empty `catch {}` blocks are rejected in code review.

### XI. Clean Diff Rule

Every file touched in a commit must be intentional. AI tools MUST NOT change formatting, imports, or whitespace in files unrelated to the current task.

### XII. Preserve Existing Patterns

When modifying existing code, AI MUST follow patterns already established in the codebase — same naming, same structure, same error handling approach. No introducing new patterns without ADR.

## Architecture

### XIII. Clean Architecture — Three Layers

Strict separation into three layers with unidirectional dependency:

- **Interfaces** (`apps/`) — Telegram bot, Dashboard, Mini App
- **Services** (`packages/`) — Database, Storage, AI, Cache, Queue
- **Core** (`modules/`) — Business logic, domain rules

### XIV. Repository Pattern

All database access via `BaseRepository` only. No direct Prisma calls in services or handlers. Every module has its own Repository inheriting from `BaseRepository`.

### XV. Event-Driven Communication

Modules communicate ONLY via Event Bus. No direct imports between modules. Event naming convention: `{module}.{entity}.{action}` (e.g. `invoices.payment.completed`). Three levels: Local → Internal → External (Redis Pub/Sub).

### XVI. Pluggable Architecture

Every package and module can be enabled/disabled via `.env` flags (`TEMPOT_{NAME}=true/false`). The system must function correctly with any optional module disabled.

### XVII. Graceful Shutdown

All services MUST register shutdown hooks. Shutdown order:

1. Hono server (stop accepting requests)
2. grammY bot (complete pending updates)
3. BullMQ workers (via queue factory)
4. Redis (ioredis quit)
5. Prisma ($disconnect)
6. Drizzle (pgvector pool end)

Maximum 30s timeout — `process.exit(1)` with FATAL log if exceeded.

### XVIII. Abstraction Layer for External Services

Every external service (AI, Storage, Payment) wrapped in an interface that allows swapping implementations without changing consumers. ADR required for each abstraction.

### XIX. Cache via cache-manager ONLY

No custom cache implementations. Use `cache-manager` with Keyv adapters (Memory → Redis → DB). Thin wrapper in `packages/shared/cache.ts`. ADR-011, ADR-023.

### XX. Queues via Queue Factory ONLY

No direct BullMQ setup. All queues created via factory function in `packages/shared/queue.factory.ts` (~30 lines). ADR-019.

## Error Handling

### XXI. Result Pattern

All services return `Result<T, AppError>` via `neverthrow 8.2.0`. This applies to ALL public API methods without exception — services, repositories, event bus subscribe(), guards, factories, and any exported function that can fail. No thrown exceptions in public APIs. Only internal infrastructure boot code (initial DB connection, Redis startup) may throw, and only before the application enters its run loop.

### XXII. Hierarchical Error Codes

Error code format: `module.error_name` (e.g. `user.not_found`, `invoice.payment.failed`). Every error has a unique, traceable code.

### XXIII. No Double Logging

`loggedAt` flag on `AppError` prevents logging the same error multiple times as it propagates up the stack.

### XXIV. Error Reference System

Every system error gets a unique reference code: `ERR-YYYYMMDD-XXXX`. This code links: user-facing message ↔ Audit Log entry ↔ Sentry event.

## Security

### XXV. Security by Default

Every request passes through automatic security chain:

```
sanitize-html → @grammyjs/ratelimiter → CASL Auth Check → Zod Validation → Business Logic → Audit Log
```

No request bypasses this chain. No opt-in required.

### XXVI. CASL-Based RBAC

Four roles with strict hierarchy:

- `GUEST` (level 1) — minimal access
- `USER` (level 2) — standard features
- `ADMIN` (level 3) — module management
- `SUPER_ADMIN` (level 4) — God Mode via `can('manage', 'all')`

Authorization enforced at `BaseRepository` level. ADR-013.

### XXVII. Soft Delete

Implemented via Prisma `$extends()` — never middleware. BaseEntity fields: `id`, `createdAt`, `updatedAt`, `createdBy`, `updatedBy`, `isDeleted`, `deletedAt`, `deletedBy`. `deletedBy` populated via `AsyncLocalStorage`.

### XXVIII. Secure Bootstrap

`SUPER_ADMIN` role assigned ONLY to user(s) matching `SUPER_ADMIN_IDS` environment variable. No race conditions. No self-promotion.

### XXIX. Rate Limiting

Three layers, each with its own library:

- **Bot (inbound):** `@grammyjs/ratelimiter` — per-user Telegram message throttling (ADR-020)
- **Application-level:** `rate-limiter-flexible` — per-user rate limiting for AI, services, and internal APIs (ADR-020)
- **HTTP middleware:** `hono-rate-limiter` — request-level rate limiting for Hono Dashboard/Mini App endpoints (ADR-030)

### XXX. Input Sanitization

`sanitize-html` for all user inputs before processing. ADR-020.

### XXXI. Encryption Standards

- Passwords: `bcrypt` — never stored as plaintext
- Sensitive DB fields: `AES-256` at application level
- Backup files: encrypted before upload
- API keys: encrypted in DB — never hardcoded in source

### XXXII. Redis Degradation Strategy

Every Redis operation wrapped in try/catch with fallback:

- Sessions → in-memory temporary storage
- cache-manager → direct DB queries
- BullMQ → wait for reconnection

Alert `SUPER_ADMIN` immediately on any Redis failure.

### XXXIII. AI Degradation

Every module with `hasAI=true` MUST define `aiDegradationMode`:

- `graceful` — fall back to manual input
- `queue` — queue request for later processing
- `circuit-breaker` — after 5 failures, disable AI for 10 minutes + alert SUPER_ADMIN

## Testing

### XXXIV. TDD Mandatory

RED → GREEN → REFACTOR cycle is non-negotiable. Tests are written BEFORE implementation code. `superpowers` workflow enforces this — code written before tests is rejected.

### XXXV. Test Pyramid

- Unit Tests: 70% (Vitest)
- Integration Tests: 20% (Vitest + Testcontainers)
- E2E Tests: 10% (Vitest + custom mock context via createMockContext in ux-helpers)

### XXXVI. Coverage Thresholds

| Component     | Minimum | Enforcement |
| ------------- | ------- | ----------- |
| Services      | 80%     | Build fails |
| Handlers      | 70%     | Build fails |
| Repositories  | 60%     | Warning     |
| Conversations | 50%     | Warning     |

### XXXVII. Test Naming Convention

- `describe("FeatureName")` + `it("should {action} when {condition}")`
- All test descriptions in English
- Each test independent — no shared state between tests

### XXXVIII. Zero-Defect Gate

NO phase or task advances with broken code. All tests must be 100% passing, all lint errors resolved BEFORE moving to the next step. Violation triggers immediate rollback.

## Internationalization

### XXXIX. i18n-Only Rule

ZERO hardcoded user-facing text in source code. All user-visible strings via i18n keys. No Arabic or any human language strings in `.ts` files. This rule is checked automatically at build time.

### XL. Language Rule

- **Everything developers see:** English (code, comments, docs, ADRs, variables, README, SpecKit files)
- **Everything users see:** from i18n system in user's chosen language
- **No human-readable text written directly in code — ever**

### XLI. Default Languages

Arabic (`ar`) as PRIMARY + English (`en`). Both translation files MUST be created from day one with every new module:

- `/modules/{name}/locales/ar.json`
- `/modules/{name}/locales/en.json`

### XLII. Regional Defaults

Default locale: `ar-EG`. Default country: `EG` (Egypt). RTL support required for all user interfaces. All dates stored as UTC — displayed via `RegionalEngine`.

### XLIII. Translation Completeness

`pnpm cms:check` MANDATORY in CI/CD pipeline for every PR that touches `/locales/` files. Missing translations block the PR.

## Workflow & Tooling

### XLIV. ADR Requirement

Every architectural decision MUST have an ADR document at `docs/archive/architecture/adr/ADR-{number}-{title}.md` BEFORE implementation. ADR format: Context → Decision → Consequences → Alternatives Rejected.

### XLV. Dependency Rule

External libraries must meet ALL criteria:

- 500+ GitHub stars
- Active development within last 6 months
- TypeScript compatible
- Node.js 20+ compatible

ADR required for any substitution from the tech stack defined in `tempot_v11_final.md` Section 2.

### XLVI. Module Creation Gate

No module exists without an approved specification. `spec.md` with all clarifications resolved MUST exist before any module code is written. This is enforced by the Handoff Gate (Rule LXXIX) and code review.

### XLVII. Technical Contracts

`detailed-specs.md` REQUIRED when module has:

- `hasAI=true` — document AI usage, degradation mode
- Complex algorithm — mathematical definition, edge cases
- Advanced security — encryption mechanism, rate limiting details
- Complex external integration — failure scenarios, retry mechanism

### XLVIII. Supported Tools

Claude Code and Gemini CLI are both supported. `superpowers` plugin is MANDATORY on whichever tool is used. Context file (`CLAUDE.md` or `GEMINI.md`) must exist at project root.

### XLIX. No Skip Rule

- ❌ No implementation without approved `spec.md` + `/speckit.clarify`
- ❌ No code without brainstorming + approved design
- ❌ No module creation without approved `spec.md`
- ❌ No code before tests (TDD enforced)
- ✅ Exception: Spike/prototype with explicit "will not enter production" label

## Governance

### L. Code-Documentation Parity (Bidirectional)

Code MUST match documentation and documentation MUST match code. This is bidirectional — not one-way:

1. **Code → Docs:** No code change enters `main` without updating ALL affected documentation artifacts. "Affected" includes: SpecKit artifacts (`spec.md`, `plan.md`, `data-model.md`, `tasks.md`, `research.md`), `ROADMAP.md`, ADR README index, architecture spec (`docs/archive/tempot_v11_final.md`), context file (`CLAUDE.md`) tech stack, and CHANGELOG via Changesets.
2. **Docs → Code:** No documentation change enters `main` without verifying the code still matches the updated documentation.
3. **Automated checks:** Two mandatory gates after any artifact update: (a) `/speckit.analyze` verifies internal consistency between SpecKit artifacts (spec ↔ plan ↔ tasks ↔ data-model), and (b) `pnpm spec:validate` verifies spec→code alignment. Both must pass. Manual verification is STILL REQUIRED for ADR index, ROADMAP, architecture spec, and CLAUDE.md alignment.
4. **Scope:** This applies to ALL change types — new features, bugfixes, refactors, and dependency updates. No exceptions.

Violation: Any merge with code-documentation drift is a CRITICAL finding that blocks integration.

### LI. Reserved

_Reserved for future use._

### LII. Constitution Authority

This constitution is the highest authority in the project. All AI tools MUST reference it before making any architectural or implementation decision. Constitution overrides any conflicting instruction.

### LIII. Amendment Process

Amendments require:

- Description of the change
- Rationale explaining why
- Date of amendment
- Project owner approval

Constitution versioning: `MAJOR.MINOR.PATCH`.

### LIV. Blast Radius Rule

Any modification to shared code (`packages/shared/`, `packages/database/`, base types, shared interfaces) MUST be preceded by impact analysis on all dependent modules and packages. No shared code change without documented blast radius assessment.

## Observability

### LV. Error Monitoring

Sentry integration opt-in via `SENTRY_DSN` environment variable. PII filtered via `beforeSend` hook. Self-hosted Sentry supported. Telegram alerts to SUPER_ADMIN for critical errors.

### LVI. Health Check

`GET /health` endpoint with detailed service checks:

- `database`: connection + latency
- `redis`: connection + latency
- `ai_provider`: status + circuit breaker state
- `disk`: free space
- `queue_manager`: active/waiting jobs

Status: `healthy` | `degraded` | `unhealthy`.

### LVII. Audit Log

ALL state-changing operations logged with unified structure (userId, userRole, action, module, targetId, before, after, status, timestamp). Immediate SUPER_ADMIN alert for: role changes, module disable, backup failure, repeated denied access, bulk delete.

### LVIII. Performance Thresholds

| Service     | Normal | Alert Threshold |
| ----------- | ------ | --------------- |
| Database    | <100ms | >500ms          |
| Redis       | <10ms  | >100ms          |
| AI Provider | <2s    | >10s            |
| Error Rate  | <1%    | >5%             |
| Memory      | <70%   | >90%            |

## Documentation

### LIX. Documentation-First

Every package, module, and architectural decision documented from day one. No undocumented code enters `main` branch. Documentation is part of the Definition of Done.

### LX. Package README Requirement

`README.md` required for every package and app directory with:

- Purpose and description
- API reference
- Usage examples
- Dependencies list

### LXI. Changelog

`CHANGELOG.md` updated with every release via Changesets + Conventional Commits. Auto-generated from commit history.

### LXII. Documentation Tools

- Starlight (Astro) for developer docs + end-user guide (planned — not yet set up) — 📐 ADR-038
- starlight-typedoc for monorepo API reference (one instance per package)
- JSDoc/TSDoc for all public APIs
- TypeDoc for auto-generated API reference
- Vale for prose quality enforcement
- All documentation in English

### LXIII. ADR Timing

ADR documents created BEFORE implementation, not after. ADRs are living documents updated when decisions evolve.

## UX Standards

### LXIV. Message Update Rule (Golden Rule)

Edit existing message ALWAYS instead of sending a new one. User presses button → loading indicator → update same message with result → show next-step buttons.

### LXV. Status Message Types

Four standardized status patterns:

- ⏳ Loading — action in progress
- ✅ Success — action completed
- ❌ Error — problem + solution
- ⚠️ Warning — caution + options

### LXVI. Button Standards

- Inline Keyboard: max 20 chars Arabic / 24 English, max 3 buttons per row
- Confirm + Cancel buttons always in the same row
- Emoji at start of button text for readability

### LXVII. Confirmation Behavior

- Confirmation buttons expire after 5 minutes
- Button text = action name (e.g. "🗑️ Delete Invoice"), not just "Yes"
- Clear warning if action is irreversible

### LXVIII. List Display

- Title always shows count of results
- Emoji numbers for ordering (1️⃣ 2️⃣ ...)
- Auto-pagination at 5+ items
- Empty state shows helpful message with next-step button

### LXIX. Error Message UX

- User errors: problem + clear solution
- System errors: generic message + reference code (linked to Audit Log)
- Permission errors: denial reason only — no technical details
- Session expired: notification + restart button

### LXX. Critical Bug-Fixing Methodology

> **Cross-reference:** This rule consolidates items from Rule I (no `any`/`@ts-ignore`/`eslint-disable`) and Rule VII (fix at source). It is intentionally restated here as a unified bug-fixing checklist.

1. NEVER write wrappers or proxy functions to patch or hide bad code.
2. ALWAYS fix the root cause DIRECTLY inside the problematic original code.
3. STRICTLY PROHIBITED: Using @ts-ignore, @ts-expect-error, or eslint-disable to bypass type or lint errors.

## Package Quality

### LXXI. Package Creation Checklist Required

Before writing any code for a new package, the 10-point Package Readiness Checklist
at `docs/archive/developer/package-creation-checklist.md` MUST be completed and all 10 checks
must pass. No package enters the codebase without passing the checklist.

### LXXII. Package Build Setup

Every package MUST have:

- `tsconfig.json` with `"outDir": "dist"` — NEVER `src/` or `.`
- `package.json`: `"main": "dist/index.js"`
- `package.json`: `"types": "dist/index.d.ts"`
- `package.json`: `"exports": { ".": "./dist/index.js" }`
- `package.json`: `"build"` script (e.g., `"tsc"`)

PROHIBITED: `outDir` pointing to `src/` causes build artifacts to overwrite source
files and silently breaks module resolution (root cause of 172-artifact incident,
2026-03-24).

### LXXIII. Package Test Setup

Every package MUST have:

- `vitest.config.ts` at the package root
- `vitest: "4.1.0"` — exact version, no caret, no range

### LXXIV. No console.\* in Production Code

FORBIDDEN in `src/`: `console.log`, `console.warn`, `console.error`, `console.info`,
`console.debug`.

When a logger is not available (e.g., foundational packages with circular dep risk):

```typescript
process.stderr.write(JSON.stringify({ level: 'error', msg: '...', ...context }) + '\n');
```

### LXXV. No Test Scaffolding in Production Code

FORBIDDEN in `src/`: parameters named `simulateFailure`, `testMode`, `forceError`,
`__test__`, `isTest`, or any parameter whose sole purpose is to alter behavior for tests.

Tests MUST use `vi.spyOn()` or `vi.mock()` to simulate failure conditions.

### LXXVI. Exact Version Pinning for Critical Dependencies

These MUST be exact — no `^` or `~`:

- `neverthrow`: `"8.2.0"`
- `vitest`: `"4.1.0"`
- `typescript`: `"5.9.3"`

### LXXVII. No Phantom Dependencies

Every dependency declared in `package.json` MUST have at least one import from it in
`src/`. Before finalizing `package.json`, verify:

```bash
grep -r "from 'package-name'" src/
```

Phantom dependencies are a CRITICAL finding at code review and block merge.

### LXXVIII. Clean Workspace Gate

Before running tests or building any package:

1. Verify no `*.js` or `*.d.ts` files exist inside `src/`
2. Run: `find src/ \( -name "*.js" -o -name "*.d.ts" \)` — MUST return empty
3. `tsconfig.json` `outDir` MUST be `"dist/"` — any config writing to `src/` is a
   CRITICAL violation that blocks all test runs

Root cause of this rule: 172 stale build artifacts across 7 packages caused silent
test failures where Vitest loaded stale `.js` files instead of `.ts` source
(incident date: 2026-03-24).

## Development Methodology — SpecKit + Superpowers

> **Authority:** This section is the SOLE reference for the development workflow.
> **Reference:** `docs/archive/developer/workflow-guide.md` for the detailed practical guide.

### LXXIX. Spec-Driven Development is Mandatory

No production code shall be written without a validated specification. The specification is the source of truth. "Vibe coding" (writing code from ad-hoc prompts without a spec) is FORBIDDEN.

### LXXX. Two Toolchains, Two Roles

**SpecKit** produces the specification artifacts — what to build and why.
**Superpowers** consumes those artifacts and produces working code — how to build it.

They are not two phases of a rigid pipeline. They are two complementary toolchains. SpecKit's output feeds Superpowers' input.

### LXXXI. SpecKit — Specification Toolchain

SpecKit commands produce specification artifacts in `specs/{NNN}-{feature-name}/`:

| Command                 | Purpose                            | Output                                    | Required?   |
| ----------------------- | ---------------------------------- | ----------------------------------------- | ----------- |
| `/speckit.constitution` | Project principles                 | `constitution.md`                         | Once (done) |
| `/speckit.specify`      | Define what & why (NO tech stack)  | `spec.md`                                 | YES         |
| `/speckit.clarify`      | Expose edge cases & ambiguities    | Updated `spec.md`                         | YES         |
| `/speckit.plan`         | Technical implementation plan      | `plan.md`, `data-model.md`, `research.md` | YES         |
| `/speckit.checklist`    | Domain-specific quality validation | `checklists/*.md`                         | Recommended |
| `/speckit.analyze`      | Cross-artifact consistency check   | Report                                    | YES         |
| `/speckit.tasks`        | Actionable task breakdown          | `tasks.md`                                | YES         |

`/speckit.implement` exists but is NOT used in this project — Superpowers handles execution.

For SpecKit branch detection with numbered directories: `$env:SPECIFY_FEATURE = "{NNN}-{feature-name}"`

### LXXXII. Handoff Gate — SpecKit → Superpowers

Before Superpowers begins, these MUST exist:

- `spec.md` with clarifications resolved (no `[NEEDS CLARIFICATION]` markers)
- `plan.md` with tech stack decisions
- `tasks.md` with ordered task breakdown
- `data-model.md` with entity definitions
- `research.md` with technical research findings
- `/speckit.analyze` passed with zero critical issues
- `pnpm spec:validate` passed with zero CRITICAL issues

### LXXXIII. Superpowers — Execution Toolchain

Superpowers skills activate in this natural sequence. Each reads the SpecKit artifacts as input:

| Skill                            | Purpose                            | Input                   | Output                                       |
| -------------------------------- | ---------------------------------- | ----------------------- | -------------------------------------------- |
| `brainstorming`                  | Socratic design refinement         | `spec.md` + `plan.md`   | `docs/archive/superpowers/specs/{date}-{feature}.md` |
| `using-git-worktrees`            | Isolated branch                    | Approved design         | Feature branch + clean worktree              |
| `writing-plans`                  | Granular 2-5 min tasks             | Design doc + `tasks.md` | `docs/archive/superpowers/plans/{date}-{feature}.md` |
| `subagent-driven-development`    | Execute with TDD + review          | Execution plan          | Working code + tests                         |
| `requesting-code-review`         | Review against spec + constitution | Completed code          | Review report                                |
| `verification-before-completion` | Final validation                   | All code + tests        | Verification report                          |
| `finishing-a-development-branch` | Merge or PR                        | Verified code           | Merged branch                                |

On platforms with subagent support (Claude Code), `subagent-driven-development` is required.
On platforms without (Gemini CLI), use `executing-plans` instead.

Additional skills available during execution:

- `systematic-debugging` — 4-phase root cause analysis (includes `root-cause-tracing`, `defense-in-depth`, `condition-based-waiting`)
- `receiving-code-review` — Process review feedback systematically
- `dispatching-parallel-agents` — Concurrent subagent workflows

### LXXXIV. How the Tools Connect

```
SpecKit                              Superpowers
────────                             ────────────
specify → spec.md ──────────────────→ brainstorming reads spec.md
clarify → updated spec.md            (asks Socratic questions to deepen design)
plan    → plan.md  ─────────────────→ brainstorming reads plan.md
checklist (optional)                  (validates tech choices)
analyze → consistency check
tasks   → tasks.md ─────────────────→ writing-plans converts to 2-5 min tasks
                                      subagent-driven-development executes
                                      requesting-code-review validates
                                      finishing-a-development-branch merges
```

Key principle: Superpowers `brainstorming` does NOT replace SpecKit's specification.
It DEEPENS the technical design by reading what SpecKit produced and asking implementation-level questions.

### LXXXV. Git Workflow

NEVER develop directly on `main`. Every feature gets its own branch via `using-git-worktrees`.
Only ONE package may be in active execution at a time.
Multiple packages may be in specification simultaneously.

### LXXXVI. Quality Gates

| Gate                | When                 | Criteria                                                         |
| ------------------- | -------------------- | ---------------------------------------------------------------- |
| Spec Gate           | After clarify        | User stories have acceptance criteria, edge cases documented     |
| Plan Gate           | After analyze        | `/speckit.analyze` passes, no critical issues                    |
| Handoff Gate        | Before brainstorming | spec.md + plan.md + tasks.md + data-model.md + research.md exist |
| TDD Gate            | During execution     | Every code change has a failing test first                       |
| Review Gate         | After code review    | Zero CRITICAL issues                                             |
| Reconciliation Gate | Before merge         | `pnpm spec:validate` passes with zero CRITICAL issues (see Rule XC for deferred package exceptions) |
| Merge Gate          | Before finish        | All tests pass, all acceptance criteria met                      |

### LXXXVII. Hotfix Track

For P0/P1 production bugs only:

- Document in GitHub Issue with `hotfix` label
- Fix with mandatory unit test (≤2 hours, ≤50 lines)
- PR with `fix!:` or `security:` prefix
- Retroactive spec update within 48 hours
- SUPER_ADMIN approval required

### LXXXVIII. Retroactive Compliance

Packages built before this methodology was ratified (database, shared, logger, event-bus, auth-core) must be brought into compliance: generate missing `tasks.md`, create missing design docs, run code review.

### LXXXIX. Roadmap Tracking

`docs/archive/ROADMAP.md` is the single source of truth for project progress. Updated after every branch merge.

### XC. Deferred Package Exception

Packages formally marked as **"Not started / Deferred"** in `docs/archive/ROADMAP.md` are exempt from the Reconciliation Gate (`pnpm spec:validate` CRITICAL requirement) until they enter active execution.

**Deferred packages as of 2026-04-25:**

| Spec | Package         | Reason for deferral                                                        |
| ---- | --------------- | -------------------------------------------------------------------------- |
| 008  | cms-engine      | Optional — built only when a business module requires CMS                  |
| 013  | notifier        | Optional — built only when a business module requires notifications        |
| 014  | search-engine   | Optional — built only when a business module requires search               |
| 016  | document-engine | Optional — built only when a business module requires document generation  |
| 017  | import-engine   | Optional — built only when a business module requires CSV/Excel import     |

**Rules for deferred packages:**

1. `spec.md` and `plan.md` MUST exist — they are forward design artifacts.
2. `tasks.md`, `data-model.md`, `research.md` are NOT required until active execution begins.
3. `FILE_REFERENCES` failures against non-existent source files are expected and informational only.
4. `spec:validate` CRITICAL failures from deferred packages do NOT block the Reconciliation Gate.
5. Once a deferred package enters active execution (decision recorded in ROADMAP.md with date), it immediately falls under the full SpecKit workflow (Rules LXXIX–LXXXIX) with no exceptions.

**Condition to activate:** SUPER_ADMIN decision recorded as a ROADMAP.md dated update.

---

**Version**: 2.4.0 | **Ratified**: 2026-03-21 | **Last Amended**: 2026-04-25
**Amendment 2.4.0**: Added Rule XC — Deferred Package Exception. Formalizes the distinction between roadmap-deferred packages (informational spec:validate failures) and active packages (full compliance required). Resolves methodology ambiguity identified in project audit 2026-04-24. Total: 90 rules (+ 1 reserved).
**Amendment 2.3.1**: Fixed 7 broken documentation paths — all `docs/` references updated to `docs/archive/` to match actual file locations (Rule L, XLIV, LXXI, LXXIX–LXXXIX section header, LXXXIII table, LXXXIX).
**Amendment 2.3.0**: Phase 1A.2 documentation cleanup — removed phantom `pnpm generate:module` references (Rule XLVI rewritten), clarified rate limiting layers (Rule XXIX), fixed grammY Test reference (Rule XXXV), marked Docusaurus as planned (Rule LXII), removed session-manager from pre-methodology list (Rule LXXXVIII), updated Rule L wording. Total: 88 rules (+ 1 reserved).
**Amendment 2.2.0**: Renumbered Development Methodology from L–LX to LXXIX–LXXXIX, eliminating duplicate numbering with Governance/Observability sections. Added reserved placeholders at L and LI. Total: 87 rules (+ 2 reserved).
**Amendment 2.1.0**: Added Package Quality section (Rules LXXI–LXXVIII). Strengthened Rule XXI to cover all public APIs. Root cause: retroactive compliance review of pre-methodology packages revealed systematic build setup and code quality gaps.
