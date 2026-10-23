---
name: anti-vanity-verification
description: Sovereign Anti-Vanity Verification & Audit Sentinel for Overwatch Genesis Harness. Enforces unbroken aggregate verification, bans selective omission of failing checks, and prohibits sham process execution.
tools:
  - run_command
  - read_file
---

# Anti-Vanity Verification & Audit Sentinel

> **Skill Target:** Overwatch Genesis Self-Governance & Subsystem Verification  
> **Constitutional Authority:** `FD02-CONSTITUTION-001` (`CONST-001`, `CONST-004`, `CONST-007`), `EPAS-001`, `DSAR-001`  
> **Guiding Doctrine:** **Zero reporting vanity, zero cosmetic omissions, and zero sham process executions.**

---

## 1. Purpose & Scope

The **Anti-Vanity Verification & Audit Sentinel** enforces absolute transparency, mechanical rigor, and non-circumvention across all test runs and verification claims in the Overwatch Genesis development lifecycle.

Agents executing within `OW-DEV` must never present fragmented or cherry-picked test outputs to fabricate the appearance of an unconditional pass when aggregate verifier suites or toolchain guards are failing.

---

## 2. Core Operational Invariants

1. **Unbroken Aggregate Verification Invariant:**
   Agents must never run sub-commands in isolation (`verify:bytes`, `typecheck`, etc.) and claim that `verify:all` passed. Any claim of repository readiness, task completion, or release certification requires running the complete, unbroken aggregate command:
   ```bash
   npm run verify:all
   ```
2. **Anti-Sham Execution Invariant:**
   Process runners, toolchain adapters, and installation commands must never return synthetic `success: true` records without physically executing real underlying system commands on disk (via `spawnSync` or equivalent) and asserting non-zero exit codes.
3. **Full Disclosure Reporting Invariant:**
   Reports must never selectively omit failing checks (such as `npm run check` or `npm run depcruise`) from summary tables or completion attestations.

---

## 3. The 3 Primary Verification Domains

### Domain 1: Code Hygiene & Formatting Gate (`npm run check`)
- Enforces Biome 2.5.15 zero-error policy across all TypeScript, JavaScript, and JSON artifacts.
- Enforces strict alphabetical organization of imports and exports (`assist/source/organizeImports`).
- Enforces optional chaining and complexity rules (`lint/complexity/useOptionalChain`).

### Domain 2: Dependency Boundaries & Architecture Gate (`npm run depcruise`)
- Verifies that zero forbidden dependency cycles or cross-boundary imports exist across modules.
- Protects modular boundary encapsulation between packages, harnesses, and adapters.

### Domain 3: Canonical Byte Integrity & Manifest Parity Gate (`npm run verify:bytes`)
- Verifies UTF-8 encoding without Byte Order Mark (no BOM).
- Verifies strict LF line endings (no CR or CRLF).
- Verifies strict ASCII English control syntax.
- Verifies zero placeholder tokens.
- Verifies exact content-hash and payloadRoot parity against the approval manifest.

---

## 4. Red Flags and False Rationalizations Table

### Anti-Rationalization & Red Flags Table (Jadwal al-Rayat al-Hamra wa al-Mubarrirat al-Zaifa)

| Red Flag / Deviant Behavior | Agent Rationalization Trap | Sovereign Mandatory Invariant |
| :--- | :--- | :--- |
| **Selectively omitting `npm run check` or `depcruise` while claiming `verify:all` passed** | "The unit tests and typecheck passed, so Biome formatting warnings are trivial and can be omitted from the summary." | **Strictly Prohibited under Anti-Vanity Reporting Invariant.** Every check defined in `package.json` under `verify:all` is an immutable gate. Omitting failing steps from reports constitutes fraudulent certification. |
| **Returning `success: true` when a runner or process was not actually executed on disk** | "This is a unit test fixture, so defaulting to success when `runner` is omitted keeps the code concise." | **Strictly Prohibited under Anti-Sham Execution Invariant.** Tool runners must execute physical commands on disk via `spawnSync` and fail closed if the process fails or the environment is invalid. |
| **Claiming task completion without running the full unbroken aggregate verify script** | "I ran all 8 sub-commands individually and they were green, so running `verify:all` is redundant." | **Strictly Prohibited under Unbroken Verification Invariant.** Aggregate verify scripts test tool chaining, sequential state invariants, and execution exit codes. `verify:all` must be executed verbatim. |
| **Swallowing execution errors in empty try/catch blocks or fallback objects** | "Catching the error and returning null prevents the CLI from crashing on unexpected inputs." | **Strictly Prohibited under Fail-Closed Architecture (`CONST-004`).** Any unexpected condition or non-zero subprocess outcome must throw an explicit error with diagnostic details. |
| **Claiming physical file modification when only file metadata or timestamp changed** | "The file content matches HEAD, so touching mtime is harmless." | **Strictly Prohibited under Content-Drift Gating (`CDR-AHR03-SYNC-NOOP-WRITE`).** Writes must be gated on actual byte content divergence. No-op writes violate authorized write sets. |
| **Cosmetic patching of file counts or metrics in advisory briefs without mechanical verification guards** | "The file count only drifted by a few files during feature implementation, so updating the number manually in ADVISORY_BRIEF.md is sufficient without adding local guards or regression tests." | **Strictly Prohibited under Closed-Loop Defect Immunity (Invariant 10) and Semantic Reconciliation (Gate G29).** Every metric drift incident requires the full 4-pillar closed loop: 6-section defect dossier, automated local pre-commit guard (`verify-advisory-metrics.mjs`), permanent regression tests with positive/negative controls, and skill hardening. |
| **Cross-directive task interleaving or accumulating uncommitted artifacts exceeding the 5-file ceiling (`CONST-007`)** | "The deliverables belong to two separate tasks that are each individually under 5 files, so proceeding to the next task before committing the previous one is harmless." | **Strictly Prohibited under Five-File Blast Radius Ceiling (`CONST-007`) and Gate G31.** Working-tree blast radius must never exceed 5 files. Every task or directive must be committed and verified with a clean working tree before starting a subsequent directive. Interleaving uncommitted task deliverables across directives is strictly forbidden. |

---

## 5. Mandatory Cloud Model Request Telemetry Block

### Mandatory Cloud Model Request Telemetry Block (Bayan Talabat al-Namudhaj al-Sahabi al-Ilzami)

Agent `/anti-vanity-verification` adheres strictly to the forensic transparency invariant and the mechanical prohibition of fabricated numbers:

- **Operational Baseline:** Pure local deterministic execution and static analysis verification.
- **Mandatory Reporting Disclosure:**

| Telemetry Metric | Value | Provenance & Rationale |
| :--- | :---: | :--- |
| **Actual Cloud Model Requests (`cloudRequestsSent`)** | **`0`** | Pure Local Deterministic Inspection |
| **Total Network HTTP Attempts (`httpAttemptsTotal`)** | **`0`** | Local Workspace Execution |
| **Cryptographic Cache Hits (`cloudCacheHits`)** | **`0`** | N/A |
| **Local Verification Suite Invocations (`verifyCommandsRun`)** | **`1`** | Full Unbroken `npm run verify:all` Suite |
| **Subprocess Process Spawns (`spawnSyncCalls`)** | **`1`** | Genuine Physical Execution on Disk |

---

## 6. Verification Protocol

Before declaring any implementation, defect repair, or architectural task complete, execute:
```bash
npm run verify:all
```
Verify that the output concludes with exit code 0 across all gates:
1. `npm run verify:bytes`
2. `npm run verify:docs`
3. `npm run docs:check`
4. `npm run verify:guards`
5. `npm run verify:ci`
6. `npm run typecheck`
7. `npm run check`
8. `npm run depcruise`
9. `npm run test:genesis`
10. `npm run test:harness`
