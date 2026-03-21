# Tempot Constitution

## Core Principles

### I. TypeScript Strict Mode
TypeScript `strict: true` is mandatory. No `any` types. STRICTLY PROHIBITED: Using @ts-ignore, @ts-expect-error, or eslint-disable to bypass type or lint errors.

### II. Code Limits (ADR-030)
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
All services return `Result<T, AppError>` via `neverthrow 8.2.0`. No thrown exceptions in business logic. Only infrastructure code (DB connections, Redis) may throw.

### XXII. Hierarchical Error Codes
Error code format: `module.error_name` (e.g. `user.not_found`, `invoice.payment.failed`). Every error has a unique, traceable code.

### XXIII. No Double Logging
`loggedAt` flag on `AppError` prevents logging the same error multiple times as it propagates up the stack. ADR-034.

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
- Bot: `@grammyjs/ratelimiter` (official grammY plugin)
- API: `rate-limiter-flexible` for Hono Dashboard/Mini App
- ADR-020

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
- E2E Tests: 10% (Vitest + grammY Test)

### XXXVI. Coverage Thresholds
| Component | Minimum | Enforcement |
|-----------|---------|-------------|
| Services | 80% | Build fails |
| Handlers | 70% | Build fails |
| Repositories | 60% | Warning |
| Conversations | 50% | Warning |

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

## Workflow

### XLIV. Combined SpecKit + superpowers Workflow
11-step mandatory lifecycle:
- **SpecKit (steps 1-5):** constitution → specify → clarify → plan → validate
- **superpowers (steps 6-11):** brainstorming → git-worktrees → writing-plans → executing-plans + TDD → code-review → finish-branch

Do NOT use `/speckit.tasks` or `/speckit.implement` — replaced by superpowers.

### XLV. No Skip Rule
- ❌ No implementation without approved `spec.md` + `/speckit.clarify`
- ❌ No code without `brainstorming` + approved design
- ❌ No module creation without approved `spec.md`
- ❌ No code before tests (TDD enforced)
- ✅ Exception: Spike/prototype with explicit "will not enter production" label

### XLVI. Supported Tools
Claude Code and Gemini CLI are both supported. `superpowers` extension is MANDATORY on whichever tool is used. Context file (`CLAUDE.md` or `GEMINI.md`) must exist at project root.

### XLVII. ADR Requirement
Every architectural decision MUST have an ADR document at `docs/architecture/adr/ADR-{number}-{title}.md` BEFORE implementation. ADR format: Context → Decision → Consequences → Alternatives Rejected.

### XLVIII. Dependency Rule
External libraries must meet ALL criteria:
- 500+ GitHub stars
- Active development within last 6 months
- TypeScript compatible
- Node.js 20+ compatible

ADR required for any substitution from the tech stack defined in `tempot_v11_final.md` Section 2.

### XLIX. Module Creation Gate
CLI Generator (`pnpm generate:module`) refuses to run without an approved `spec.md`. No module exists without specification.

### L. Hotfix Track
Limited exception for critical production bugs (P0/P1):
- SUPER_ADMIN approval required
- Maximum 50 lines of code
- Unit test mandatory even for hotfix
- `spec.md` created retroactively within 48 hours
- PR prefix: `security:` or `fix!:`

### LI. Technical Contracts
`detailed-specs.md` REQUIRED when module has:
- `hasAI=true` — document AI usage, degradation mode
- Complex algorithm — mathematical definition, edge cases
- Advanced security — encryption mechanism, rate limiting details
- Complex external integration — failure scenarios, retry mechanism

## Governance

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
| Service | Normal | Alert Threshold |
|---------|--------|-----------------|
| Database | <100ms | >500ms |
| Redis | <10ms | >100ms |
| AI Provider | <2s | >10s |
| Error Rate | <1% | >5% |
| Memory | <70% | >90% |

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
- Docusaurus for developer docs + end-user guide
- JSDoc/TSDoc for all public APIs
- TypeDoc for auto-generated API reference
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
1. NEVER write wrappers or proxy functions to patch or hide bad code.
2. ALWAYS fix the root cause DIRECTLY inside the problematic original code.
3. STRICTLY PROHIBITED: Using @ts-ignore, @ts-expect-error, or eslint-disable to bypass type or lint errors.

---

**Version**: 1.1.0 | **Ratified**: 2026-03-21 | **Last Amended**: 2026-03-21
