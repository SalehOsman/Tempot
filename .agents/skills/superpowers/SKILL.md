---
name: superpowers
description: Sovereign Test-Driven Development (TDD), systematic debugging, and verification discipline. Enforces RED-GREEN-REFACTOR cycle before source code, strictly bans trial-and-error editing, and mandates physical terminal verification before completion claims.
tools:
  - run_command
  - read_file
  - write_file
  - edit_file
---

# Sovereign Quality & Testing Discipline: Superpowers

> **Skill Target:** Universal Test-Driven Development & Verification Standard
> **Taxonomy Classification:** Category 3: Quality and Testing (`skills-vault/3-quality-and-testing/`)
> **Constitutional Authority:** `FD02-CONSTITUTION-001` (`CONST-001`, `CONST-004`, `CONST-007`, `CONST-010`, `CONST-012`, `CONST-016`), User Global Rules #7, #10, #12, #14
> **Upstream Lineage:** Derived from `obra/superpowers` core engineering disciplines
> **Guiding Doctrine:** **Zero production code authoring without a failing test, zero unverified assumptions, zero cosmetic assertions, and zero completion claims without physical terminal evidence.**

---

## 1. Purpose & Core Doctrine

The **Superpowers Quality Discipline** establishes uncompromising software verification standards across all engineering tasks. It eliminates the single largest source of software failure: writing ungrounded implementation code against ambiguous mental models without deterministic, automated verification harness.

Software engineering without rigorous Test-Driven Development (TDD) produces brittle architectures, regression cascades, and invisible failure modes. Superpowers transforms software authoring from speculative trial-and-error guesswork into an exact, reproducible sequence of verifiable state transitions.

```text
+---------------------------------------------------------------------------------------+
|                             SUPERPOWERS VERIFICATION CYCLE                            |
+---------------------------------------------------------------------------------------+
|  1. SPECIFICATION GROUNDING  --> Explicit contract, inputs, outputs, invariants       |
|  2. RED PHASE                --> Write failing test, verify expected failure mode     |
|  3. GREEN PHASE              --> Minimal surgical code to satisfy the test contract   |
|  4. REFACTOR PHASE           --> Clean design, eliminate duplication, preserve green  |
|  5. PHYSICAL VERIFICATION    --> Full test suite pass with exit code 0                |
+---------------------------------------------------------------------------------------+
```

---

## 2. The Red-Green-Refactor Lifecycle

Every functional addition, bug fix, or behavioral modification must proceed through the three strict phases of the Red-Green-Refactor lifecycle:

### Phase A: The RED Phase (Failing Test First)
1. **Define the Behavioral Contract:**
   Before creating or editing any production file in `packages/*/src/` or `modules/*/src/`, author a dedicated test that models the required capability.
2. **Execute the Unimplemented Test:**
   Run the test runner immediately. The test MUST fail. If the test passes before implementation code is written, the test is invalid, cosmetic, or testing existing functionality.
3. **Verify the Failure Signature:**
   Inspect the exact error message and failure stack. The failure reason must match the missing capability (e.g. `ReferenceError: function undefined` or `AssertionError: expected false to be true`). Never proceed if the test fails due to a configuration error, syntax error, or unhandled runner exception.

### Phase B: The GREEN Phase (Minimal Surgical Implementation)
1. **Write Only Necessary Code:**
   Implement the exact logic required to transition the failing test to green. Do not implement unrequested features, premature abstractions, or speculative helper functions.
2. **Run the Targeted Test:**
   Execute the specific test in isolation. Confirm that the failure signature is completely resolved and the test passes cleanly.
3. **Run Existing Regression Suites:**
   Execute all adjacent tests in the package to ensure that the surgical addition introduced zero unintended regressions.

### Phase C: The REFACTOR Phase (Design Cleanliness Under Protection)
1. **Code Hardening:**
   Clean up variable naming, extract private helper functions, remove dead code paths, and optimize algorithms while the suite remains continuously green.
2. **Zero Invariant Mutations:**
   Never alter test expectations or weaken assertions during refactoring. If refactoring requires modifying test assertions, stop immediately: the interface contract was broken.

---

## 3. Systematic Debugging Protocol

When encountering unexpected behavior, broken tests, or system defects, agents and engineers are strictly forbidden from making speculative trial-and-error edits. Debugging must follow a deterministic four-step forensic protocol:

1. **Step 1: Defect Reproduction and Failure Pinpointing**
   - Reproduce the exact issue with an automated test case or minimal reproducible command.
   - Capture the exact terminal output, stack trace, and exit code.
   - Formulate a precise hypothesis explaining why the behavior diverges from the specification.
2. **Step 2: Five-Whys Root Cause Analysis (RCA)**
   - Trace backwards from the symptom to the ultimate architectural or logic flaw.
   - Document the causal chain: Symptom -> Trigger -> Flawed Assumption -> Missing Guard -> Architectural Root Cause.
3. **Step 3: Test Assertion Immunity**
   - Under User Global Rule #12, test assertions are immutable contracts.
   - When a test fails, the defect conclusively resides in production code. Relaxing assertions, increasing timeouts artificially, swallowing errors, or deleting tests is treated as severe governance malpractice.
4. **Step 4: Surgical Remediation and Regression Sealing**
   - Apply the minimal code fix that directly addresses the root cause identified in Step 2.
   - Retain the reproduction test permanently in the automated test suite as an anti-regression sentinel.

---

## 4. Worktree Isolation Invariant

To guarantee atomic branch hygiene and eliminate cross-feature workspace contamination, independent tasks must operate in dedicated, isolated environments:

1. **One Branch, One Objective (OBOO Invariant):**
   Every feature, defect fix, or architectural phase must execute within its own isolated branch branched cleanly from the verified main baseline.
2. **Zero Contamination:**
   Never combine unrelated bug fixes into a feature branch, and never commit feature enhancements inside a defect repair branch.
3. **Ephemeral Worktree Workspaces:**
   When executing parallel or high-risk tasks, leverage isolated git worktrees or dedicated branch checkouts so that workspace state, build artifacts, and lockfiles never leak across concurrent tasks.

---

## 5. Evidence-Before-Assertion Invariant

Superpowers enforces the universal rule: **No victory declaration without physical terminal evidence.**

1. **Exit Code Zero Invariant:**
   An engineer or agent may never state "all tests pass", "the build is clean", or "verification is complete" without executing the command in the live environment and confirming exit code 0.
2. **Anti-Vanity Test Discipline:**
   Every test assertion must evaluate concrete domain state, physical filesystem artifacts, database rows, or network transmissions. Tests consisting solely of `assert.ok(true)`, trivial string matching on mocked objects, or unasserted function executions are strictly rejected.
3. **Aggregate Verification:**
   Before declaring a task done, execute the full aggregate test suite (`npm test` or canonical verification script) to ensure complete repository harmony.

---

## 6. 🚫 Anti-Rationalization Table & Red Flags

| Red Flag / Deviant Behavior | Agent Rationalization Trap | Sovereign Mandatory Invariant |
| :--- | :--- | :--- |
| **"Write the code first, add tests later"** | "Writing the code first allows me to explore the design faster, and I will write thorough unit tests immediately afterward." | **Strictly Prohibited under the Spec-Before-Code and TDD Invariant (`CONST-010`, Rule #7).** Writing code before tests leads to confirmation-biased tests that validate what the code does rather than what the specification requires. Red phase must precede green. |
| **"Speculative trial-and-error editing"** | "The test failed with an unexpected error, so let me quickly tweak three different files and rerun to see what happens." | **Strictly Prohibited under Systematic Debugging Protocol (`DEV-01`, Rule #12).** Speculative edits corrupt git history and obscure root causes. The engineer must isolate the failure, perform a 5-Whys RCA, and formulate a verifiable hypothesis before editing code. |
| **"Modifying or weakening test assertions on failure"** | "The test expectation was too strict or outdated, so adjusting the assertion makes the test suite pass cleanly." | **Strictly Prohibited under Absolute Test Immunity Invariant (User Global Rule #12).** Tests represent immutable specification contracts. When tests fail, the fault lies in production logic. Weakening tests constitutes cosmetic fraud. |
| **"Phantom completion claims without terminal run"** | "I carefully inspected the code diff and logically reasoned that all syntax and imports are valid, so the tests will pass." | **Strictly Prohibited under Evidence-Before-Assertion Invariant (`CONST-004`, `CONST-020`).** Human reasoning cannot substitute for physical execution on disk. A task is unverified until terminal execution yields exit code 0. |
| **"Vanity assertions that test nothing"** | "Asserting that a mocked service returns true proves that our pipeline integration works." | **Strictly Prohibited under Anti-Vanity Verification standard (`WF-05`, Gate 10).** Tests must assert concrete domain state transitions, data mutations, and real boundary conditions. Mocking out the entire domain invalidates the test. |

---

## 7. 📡 Mandatory Cloud Model Request Telemetry Block

Agent `/superpowers` operates under the strict forensic transparency invariant and mechanical prohibition of synthetic metrics:

- **Operational Baseline:** Pure local deterministic execution, unmocked unit and integration testing, and terminal exit code inspection.
- **Mandatory Reporting Disclosure:**

| Telemetry Metric | Value | Provenance & Rationale |
| :--- | :---: | :--- |
| **Actual Cloud Model Requests (`cloudRequestsSent`)** | **`0`** | Pure Local Deterministic Inspection |
| **Total Network HTTP Attempts (`httpAttemptsTotal`)** | **`0`** | Local Workspace Execution |
| **Cryptographic Cache Hits (`cloudCacheHits`)** | **`0`** | N/A |
| **Local Verification Suite Invocations (`verifyCommandsRun`)** | **`2`** | Node.js Test Runner and Canonical Byte Verifier |
| **Subprocess Process Spawns (`spawnSyncCalls`)** | **`2`** | Genuine Physical Execution on Disk |

---

## 8. Verification Protocol

Before declaring any quality verification task or test suite execution complete:

1. Execute canonical byte formatting verification:
   ```bash
   node scripts/genesis/verify-canonical-bytes.mjs
   ```
2. Run targeted test suites under Node.js native test runner:
   ```bash
   node --test path/to/your.test.mjs
   ```
3. Run aggregate workspace verification:
   ```bash
   npm test
   ```
4. Verify that working-tree modifications conform strictly to the 5-file bounded ceiling:
   ```bash
   node scripts/genesis/verify-blast-radius.mjs
   ```
