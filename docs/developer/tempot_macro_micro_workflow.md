# Tempot v11 Lifecycle and Workflow Mapping

## 1. Current Project Assessment
- **Phase 0 (Completed):** Monorepo workspace initialized. Strict `constitution.md` finalized. TypeScript, ESLint, Vitest, Husky configured. Minimal PoC `bot-server` created.
- **Architectural Specs:** 17 Package Specs are complete and located in `specs/`.
- **Execution Plans:** 17 Execution Plans are complete and located in `docs/superpowers/plans/` mapping exactly to the 17 specs.
- **Identified Gaps:**
  - `packages/module-registry` exists as an empty directory with no spec or plan.
  - `apps/bot-server` prototype needs a complete rewrite spec (Phase 2).
  - `modules/` (Business Modules) and `apps/dashboard` do not have architectural specs yet.

---

## 2. Macro Workflow (Project Phases)
To maintain Clean Architecture and prevent dependency cycles, development MUST follow this strict sequence:

1. **Phase 1: Core Bedrock Packages**
   - **Current Focus.** Do not build any servers or business modules yet.
   - Start with `packages/database` and `packages/shared` (after injecting the missing TDD tasks for `AppError` and `Result`).
   - Complete the remaining 15 core packages (Cache, Event Bus, Logger, i18n, etc.).
   - *Goal: Provide all foundational tools needed for the higher layers.*

2. **Phase 2: Bot Server Reconstruction**
   - Delete the prototype inside `apps/bot-server`.
   - Write specs and plans for the new `grammY` + `Hono` implementation.
   - Integrate `Zod`, `CASL` (RBAC), and `neverthrow` tools established in Phase 1.

3. **Phase 3: Business Modules (`modules/`)**
   - Implement business logic (Users Management, Store, Points, etc.).
   - Modules must remain entirely decoupled. They communicate exclusively via the `event-bus`.

4. **Phase 4: Additional Frontends (`apps/`)**
   - Implement `dashboard` and `mini-app` to interface with the core database and business modules.

---

## 3. Micro Workflow (Daily Task Cycle)
For every package or feature, the development cycle uses the explicit `SpecKit + superpowers` methodology:

### Part 1: Architecture & Specification (Human via SpecKit)
1. **Specify:** Define the feature surface area and requirements.
2. **Clarify:** Expose edge cases and resolve ambiguities.
3. **Plan & Validate:** Produce the final architectural `spec.md`.
*(For the first 17 packages, this part is already completed).*

### Part 2: Design & Breakdown (Gemini via superpowers)
4. **Brainstorming (`/brainstorming`):** Gemini reads the spec and produces a detailed technical design `docs/superpowers/specs/{feature}.md`.
5. **Writing Plans (`/writing-plans`):** Gemini breaks the design down into hyper-granular 2-5 minute execution tasks.
6. **Git Isolation (`/using-git-worktrees`):** Create an isolated branch to protect the main codebase.

### Part 3: Execution & Verification (Gemini via superpowers)
7. **Autonomous Execution (`/dispatching-parallel-agents` or `/subagent-driven-development`):**
   - **TDD IS MANDATORY.** For every single task: Write failing test (RED) -> Implement logic (GREEN) -> Cleanup (REFACTOR). Code written without tests will be deleted.
8. **Code Review (`/requesting-code-review`):** The Technical Advisor (Human) reviews the code against `constitution.md`.
9. **Merge (`/finishing-a-development-branch`):** Verify all tests are passing, and merge cleanly into the main project.
