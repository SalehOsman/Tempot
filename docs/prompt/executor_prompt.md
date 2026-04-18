# Bot Server — Phase B Execution: Application Wiring + Cleanup

## References

Read and comply with these before any action:

- Constitution: `.specify/memory/constitution.md`
- Roles: `.specify/memory/roles.md`
- Workflow: `docs/archive/developer/workflow-guide.md`

## Toolchain

This project uses two mandatory toolchains. You MUST use their
commands and skills as specified below.

### SpecKit (Specification Artifacts)

The following artifacts were produced by SpecKit and are your
source of truth for WHAT to build:

| Artifact   | Produced by                             | Path                                 |
| ---------- | --------------------------------------- | ------------------------------------ |
| Spec       | `/speckit.specify` + `/speckit.clarify` | `specs/020-bot-server/spec.md`       |
| Plan       | `/speckit.plan`                         | `specs/020-bot-server/plan.md`       |
| Tasks      | `/speckit.tasks`                        | `specs/020-bot-server/tasks.md`      |
| Data Model | `/speckit.plan`                         | `specs/020-bot-server/data-model.md` |
| Research   | `/speckit.plan`                         | `specs/020-bot-server/research.md`   |
| Analyze    | `/speckit.analyze`                      | Passed with 0 critical issues        |

Read all artifacts before starting.

### Superpowers (Execution Skills)

Use these skills for HOW to build. Activate each via the Skill
tool before starting its phase.

| Skill                            | Purpose                                               | When to use                                          |
| -------------------------------- | ----------------------------------------------------- | ---------------------------------------------------- |
| `brainstorming`                  | Socratic design deepening                             | Phase 1: design wiring strategy                      |
| `using-git-worktrees`            | Isolated feature branch                               | Phase 2: before any code                             |
| `writing-plans`                  | Granular 2-5 min task breakdown                       | Phase 3: converting tasks to steps                   |
| `dispatching-parallel-agents`    | Concurrent independent work                           | Phase 4a: W1 + W2 + W3 in parallel (no shared state) |
| `subagent-driven-development`    | Sequential task execution with TDD + two-stage review | Phase 4b: W4 → W5 → W6 sequentially                  |
| `executing-plans`                | Inline execution without subagents                    | Phase 4 alternative (Gemini CLI only)                |
| `test-driven-development`        | RED → GREEN → REFACTOR cycle                          | Every task in Phase 4a and 4b                        |
| `requesting-code-review`         | Review against spec + constitution                    | Phase 5: after all tasks complete                    |
| `receiving-code-review`          | Process review feedback                               | Phase 5: if reviewer finds issues                    |
| `verification-before-completion` | Evidence-based final check                            | Phase 6: run tests + build                           |
| `finishing-a-development-branch` | Merge / PR / cleanup options                          | Phase 7: final integration                           |
| `systematic-debugging`           | 4-phase root cause analysis                           | Any phase: unexpected errors                         |

## What This Task Does

This task completes bot-server's **Application Assembly** (Phase 2C in ROADMAP.md). The bot-server's architecture is complete — all 11 tasks from `tasks.md` are implemented and 131 tests pass. However, the entry point (`src/index.ts`) uses **7 stub functions** instead of the real `@tempot/*` packages. This task:

1. **Cleans up** build artifacts and stale files (immediate fixes)
2. **Wires** the real packages into `index.ts` via a new `deps.factory.ts`
3. **Merges** the completed bot-server to main

**Core components:**

- `apps/bot-server/src/startup/deps.factory.ts` (NEW) — builds real OrchestratorDeps from actual package instances
- `apps/bot-server/src/index.ts` (MODIFY) — replace all stubs with `deps.factory.ts` call
- Cleanup: delete `src/index.d.ts.map`, stale worktrees, `nul` file

**Key dependencies (packages being wired):**

| Package                   | Import                                                                                                          | Initialization                                                                        |
| ------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `@tempot/logger`          | `import { logger } from '@tempot/logger'`                                                                       | Singleton — no init needed                                                            |
| `@tempot/shared`          | `ShutdownManager`, `CacheService`, `AppError`, `AsyncResult`                                                    | `new ShutdownManager(logger)`, `new CacheService(eventBus, logger)` → `.init()`       |
| `@tempot/event-bus`       | `EventBusOrchestrator`                                                                                          | `new EventBusOrchestrator({ redis, logger, shutdownManager })` → `.init()`            |
| `@tempot/database`        | `prisma`                                                                                                        | Lazy Proxy — auto-init on first access. `prisma.$connect()` for explicit connect test |
| `@tempot/session-manager` | `SessionProvider`, `SessionRepository`                                                                          | `new SessionProvider({ cache, eventBus, repository })`                                |
| `@tempot/auth-core`       | `AbilityFactory`, roles/subjects                                                                                | Used in auth middleware                                                               |
| `@tempot/settings`        | `SettingsService`, `DynamicSettingsService`, `MaintenanceService`, `SettingsRepository`, `StaticSettingsLoader` | Complex init chain — see below                                                        |
| `@tempot/i18n-core`       | `loadModuleLocales`, `t`                                                                                        | `await loadModuleLocales(modulesDir)`                                                 |
| `@tempot/module-registry` | `ModuleRegistry`, `ModuleDiscovery`, `ModuleValidator`                                                          | `new ModuleRegistry({ discovery, validator, eventBus, logger })`                      |
| `@tempot/sentry`          | `SentryReporter`, `initSentry`                                                                                  | `initSentry()` (optional, toggle-based)                                               |

**Required initialization order (10 steps):**

```
1. logger            ← pino singleton, no deps
2. shutdownManager   ← new ShutdownManager({ info: logger.info.bind(logger), error: (d) => logger.error(d) })
3. prisma            ← import { prisma } from '@tempot/database', then await prisma.$connect()
4. eventBus          ← new EventBusOrchestrator({ redis: { host, port }, logger, shutdownManager })
                       → await eventBus.init()
5. cache             ← new CacheService(eventBus, logger) → await cache.init()
6. sessionProvider   ← new SessionProvider({ cache: cacheAdapter, eventBus, repository: new SessionRepository(prisma) })
7. settingsService   ← StaticSettingsLoader.load() → new SettingsRepository(prisma) → new DynamicSettingsService(repo, eventBus, cache, logger) → new MaintenanceService(dynSettings, staticSettings) → new SettingsService(staticResult, dynSettings, maintenance)
8. i18n              ← await loadModuleLocales(modulesDir)
9. moduleRegistry    ← new ModuleRegistry({ discovery: new ModuleDiscovery({...}), validator: new ModuleValidator({...}), eventBus, logger })
10. bot + httpServer  ← createBot(token, realDeps), createHonoApp(realDeps)
```

**Design concerns to address during brainstorming:**

1. How to handle the CacheService → SessionProvider adapter mismatch? CacheService returns `AsyncResult<T | undefined | null>` but SessionProvider's `CacheAdapter` expects `Result<T | null, AppError>`. Need a thin adapter.
2. How to handle Redis configuration? EventBusOrchestrator needs `RedisBusConfig` (host, port). Should come from `process.env.REDIS_HOST` / `REDIS_PORT`.
3. Should `deps.factory.ts` be a single function or split into smaller factory functions for testability?
4. How to handle the health check probes? Each probe needs access to the real subsystem instances (prisma, cache, queue factory, etc.).
5. The existing Orchestrator tests use mocked deps — do we need additional integration tests that use real deps, or is the existing integration test sufficient with updated mocks?

## Execute

Do not improvise the workflow — activate the required skill and
follow its instructions exactly.

### Pre-Execution: Immediate Cleanup (No TDD needed)

Before starting the main workflow, perform these cleanup tasks:

1. **Delete `apps/bot-server/src/index.d.ts.map`** — Build artifact in source directory. Violates Constitution Rule LXXVIII (Clean Workspace Gate).

2. **Delete the file `nul` from the project root** — Artifact created by accident on Windows. Not a valid project file.

3. **Clean stale git worktrees** — Run `git worktree list` to check status. If any of these are stale (already merged), remove them:
   - `.worktrees/015-ai-core-phase2`
   - `.worktrees/018-settings-package`
   - `.worktrees/input-engine`
   - `.worktrees/input-engine-phase2`

   Use `git worktree remove <path>` for each stale worktree.

### Main Workflow

1. **Activate `brainstorming`** — Read `specs/020-bot-server/spec.md` + `specs/020-bot-server/plan.md` + `specs/020-bot-server/data-model.md`. Study the initialization order in data-model.md (Data Flow section, lines 255-301). Study the real package APIs by reading each package's `src/index.ts` and primary service file. Address the 5 design concerns listed above. Save design doc to `docs/superpowers/specs/YYYY-MM-DD-bot-server-wiring-design.md`. No code in this phase.

2. **Activate `using-git-worktrees`** — Create isolated branch: `feature/020-bot-server-wiring`.

3. **Activate `writing-plans`** — Convert the task list below into granular 2-5 min executable tasks. Save to `docs/superpowers/plans/YYYY-MM-DD-bot-server-wiring.md`.

   **Task list:**

   **Task W1: Create `deps.factory.ts` — Real Dependency Builder (P0)**
   - File: `apps/bot-server/src/startup/deps.factory.ts` (NEW)
   - Create a `buildRealDeps()` async function that returns `OrchestratorDeps`
   - Initialize all 10 packages in the correct order (see initialization order above)
   - Each initialization step that can fail must return `Result` and be handled
   - The function must be `≤200 lines` (Constitution Rule II) — split into helper functions as needed
   - Test file: `apps/bot-server/tests/unit/deps.factory.test.ts`
   - Tests: mock all package constructors/imports, verify initialization order, verify error handling for each step

   **Task W2: Create Cache-to-SessionProvider Adapter (P0)**
   - File: within `deps.factory.ts` or a new `apps/bot-server/src/startup/cache.adapter.ts` if needed
   - Bridge `CacheService` API (`AsyncResult<T | undefined | null>`) to `SessionProvider`'s `CacheAdapter` interface (`Result<T | null, AppError>`)
   - Also implement the `expire` method (CacheService doesn't have it — use `set` with TTL as workaround, or document the gap)
   - Test: verify adapter correctly translates between the two interfaces

   **Task W3: Create Health Check Probes (P0)**
   - File: `apps/bot-server/src/startup/health.probes.ts` (NEW)
   - Create real probe functions for: database (prisma `$queryRaw`), redis (cache ping), ai_provider (toggle check), disk (fs.statfs), queue_manager (BullMQ status)
   - Each probe must handle errors and return `SubsystemCheck`
   - Test file: `apps/bot-server/tests/unit/health.probes.test.ts`

   **Task W4: Replace `index.ts` Stubs with Real Wiring (P0)**
   - File: `apps/bot-server/src/index.ts` (MODIFY)
   - Replace `buildDeps()` with a call to `buildRealDeps()` from `deps.factory.ts`
   - Remove ALL 7 stub functions: `createStubLogger`, `createStubEventBus`, `createStubAsyncOk`, `createStubAsyncOkWithArg`, `createStubDiscovery`, `createStubValidation`, `createBotWithStubs`, `createModuleLoaderFn`
   - The new `index.ts` must be thin — only: import deps factory, call it, pass to orchestrator, handle fatal error
   - Target: `≤30 lines` (thin entry point, per spec D12 "Entry point has no business logic")
   - No test file needed — `index.ts` is tested via integration tests

   **Task W5: Update Integration Test (P1)**
   - File: `apps/bot-server/tests/integration/startup-sequence.test.ts` (MODIFY)
   - Add a test that verifies `buildRealDeps()` returns a valid `OrchestratorDeps` object with all required fields
   - Verify the initialization order is correct (logger first, HTTP server last)
   - These tests should use mocked external services (no real Docker required for CI)

   **Task W6: Verify All Existing Tests Still Pass (P0)**
   - Run `pnpm test` in `apps/bot-server`
   - All 131+ existing tests must still pass
   - The new `deps.factory.ts` tests must also pass
   - Run `pnpm lint` — zero errors

4. **Phase 4a — Activate `dispatching-parallel-agents`** — Before writing any code, study the structure and patterns of `apps/bot-server/src/startup/orchestrator.ts` to follow established conventions (dependency injection via interfaces, `Result<T, AppError>` for all failable operations).

   **Dispatch THREE parallel implementer subagents for W1, W2, W3 simultaneously.** These tasks are fully independent — they create separate files with zero shared state:

   | Subagent | Task                  | File Created                                                        | Shared Files | Independent? |
   | -------- | --------------------- | ------------------------------------------------------------------- | ------------ | ------------ |
   | Agent 1  | W1: `deps.factory.ts` | `src/startup/deps.factory.ts` + `tests/unit/deps.factory.test.ts`   | None         | ✅           |
   | Agent 2  | W2: Cache Adapter     | `src/startup/cache.adapter.ts` + `tests/unit/cache.adapter.test.ts` | None         | ✅           |
   | Agent 3  | W3: Health Probes     | `src/startup/health.probes.ts` + `tests/unit/health.probes.test.ts` | None         | ✅           |

   **Each subagent MUST:**
   - Follow TDD (`test-driven-development` skill): RED → GREEN → REFACTOR
   - After implementation: dispatch spec-reviewer subagent, then code-quality-reviewer subagent
   - Comply with all Constitution rules (no `any`, `≤200 lines`, `≤50 lines/function`, Result pattern)

   **WAIT for all three subagents to complete before proceeding to Phase 4b.**

   **⚠️ Gemini CLI fallback:** If the platform does not support subagents, activate `executing-plans` and execute W1 → W2 → W3 sequentially instead.

5. **Phase 4b — Activate `subagent-driven-development`** — Execute the remaining tasks **sequentially** (each depends on previous outputs):

   **W4 → W5 → W6** (strict sequential order — W4 imports from W1+W2+W3 outputs, W5 tests W4, W6 validates everything).

   Per task: implementer subagent → spec-reviewer → code-quality-reviewer. TDD is mandatory. If an unexpected error occurs during any task, activate `systematic-debugging` before proceeding.

6. **Activate `requesting-code-review`** — Review all changes against `specs/020-bot-server/spec.md` + constitution. Zero CRITICAL issues to proceed. If issues are found, activate `receiving-code-review` to address them.

7. **Activate `verification-before-completion`** — Run full test suite and build. Paste actual output as evidence. No claims without evidence.

   ```bash
   cd apps/bot-server && pnpm test
   cd apps/bot-server && pnpm build
   pnpm lint
   ```

8. **Documentation Sync (MANDATORY — Constitution Rule L)**

   Code and documentation MUST be in perfect alignment. After verification
   passes but BEFORE merge, update ALL affected documentation:

   **A. SpecKit Artifacts** — Update these in `specs/020-bot-server/`:
   - `tasks.md`: Add new tasks W1-W6 with acceptance criteria, mark them completed
   - `data-model.md`: Add `DepsFactory` function documentation if new types were created
   - `research.md`: Add Decision for wiring approach (factory pattern vs DI container)
   - `spec.md`: No changes expected (wiring is already covered by D26, D21)

   **B. Spec Consistency Gate** — Run `/speckit.analyze`:

   ```
   /speckit.analyze
   ```

   Fix any inconsistencies before proceeding.

   **C. Reconciliation Gate** — Run `pnpm spec:validate`:

   ```bash
   pnpm spec:validate 020-bot-server
   ```

   - Exit 0: continue
   - Exit 1: fix HIGH/MEDIUM issues or document justification
   - Exit 2: BLOCKED — fix all CRITICAL issues

   **D. Project Documentation** — Update ALL that apply:
   - `docs/archive/ROADMAP.md` — **REQUIRED** (Rule LXXXIX):
     - Update Phase 2B: bot-server status to "✅ Complete (wired + merged)"
     - Update Phase 2C: integration status
     - Update "Last updated" date
     - Update "Next steps" section
   - `CLAUDE.md` — No changes expected (no new dependencies added)
   - `docs/archive/architecture/adr/README.md` — Only if a new ADR was created

   **E. Changeset** — Create a changeset:

   ```bash
   pnpm changeset
   ```

   Select `bot-server`, change type `minor` (new wiring functionality), summary: "Wire real @tempot/\* packages into bot-server entry point, replacing stub dependencies with production initialization chain"

   **F. Re-validate** — Run `pnpm spec:validate` again after documentation updates.

9. **Activate `finishing-a-development-branch`** — Merge to main.

## Constraints

- If any gate fails or you encounter ambiguity not covered by the spec: STOP. Do NOT attempt to fix, workaround, or decide independently. Report the exact failure and wait.
- Do ONLY what this prompt requires. No bonus features, no refactoring of unrelated code, no "while I'm here" changes.
- Every public API returns `Result<T, AppError>` via neverthrow (Rule XXI).
- All code, comments, variables in English (Rule XL).
- No `any` types, no `@ts-ignore`, no `eslint-disable` (Rule I).
- Maximum 200 lines per file, 50 lines per function, 3 parameters per function (Rule II).
- No `console.*` — use `process.stderr.write(JSON.stringify(...))` if logger unavailable (Rule LXXIV).
- `outDir` must be `dist/` in all tsconfigs (Rule LXXII).
- No build artifacts (`.js`, `.d.ts`, `.d.ts.map`) in `src/` directories (Rule LXXVIII).

## Pre-Report Checklist

Before writing the Final Report, verify each item. If any item fails, fix it before reporting.

- [ ] Pre-execution cleanup completed (deleted index.d.ts.map, nul file, stale worktrees)
- [ ] All tasks W1-W6 have been executed
- [ ] Every code change followed TDD (RED → GREEN → REFACTOR)
- [ ] All tests pass (paste `pnpm test` output as evidence)
- [ ] Build succeeds (paste `pnpm build` output as evidence)
- [ ] Lint passes (paste `pnpm lint` output — zero errors)
- [ ] Code review completed with zero CRITICAL issues
- [ ] All 7 stub functions removed from `index.ts`
- [ ] `index.ts` is ≤30 lines (thin entry point)
- [ ] `deps.factory.ts` initializes packages in correct order
- [ ] No `any` types in new code
- [ ] All affected documentation updated (Constitution Rule L)
- [ ] `/speckit.analyze` passed (paste output)
- [ ] `pnpm spec:validate` passed (paste output)
- [ ] Changeset created via `pnpm changeset`
- [ ] ROADMAP.md updated with Phase 2B/2C status
- [ ] No files outside task scope were modified (Constitution Rule IX)

## Final Report

When all phases complete, report:

- Design doc path
- Branch name
- Pre-execution cleanup results (files deleted, worktrees removed)
- Tasks executed (count)
- New files created (list with line counts)
- Modified files (list with change summary)
- Test results with output evidence
- Code review summary (issues by severity)
- Documentation sync: list every documentation file updated and what changed
- `pnpm spec:validate` output (paste actual result)
- Changeset file path
- Merge status
