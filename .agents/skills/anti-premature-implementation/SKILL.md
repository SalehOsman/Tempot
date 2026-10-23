---
name: anti-premature-implementation
description: Sovereign Defect Immunity Sentinel for Spec-Before-Code Invariant. Prevents premature source code authoring, enforces Component Decision Record ratification, and halts execution before unratified modifications touch disk.
tools:
  - run_command
  - read_file
  - call_mcp_tool
---

# Sovereign Defect Immunity Sentinel: Anti-Premature Implementation

> **Skill Target:** Overwatch Genesis Harness & Component Implementation Governance
> **Constitutional Authority:** `FD02-CONSTITUTION-001` (`CONST-001`, `CONST-006`, `CONST-007`, `CONST-010`, `CONST-016`, `CONST-020`), `WF-01`, `WF-02`, User Global Rule #7, Rule #10, Rule #14
> **Incident Reference:** `INC-20261022-CODE-WITHOUT-SPEC-DRIFT`
> **Decision Reference:** `CDR-OSPR-AND-SKILLS-VAULT` (`FD10-CDR-OSPR-SKILLS-VAULT-001`)
> **Guiding Doctrine:** **Zero source code modifications without a ratified Component Decision Record on disk, an active roadmap milestone, and verified product requirement traceability. No spec, no code.**

---

## 1. Purpose & Mandate

The **Anti-Premature Implementation Sentinel** enforces the sovereign Spec-Before-Code Invariant across all autonomous and semi-autonomous AI agents operating within `OW-DEV`.

This skill acts as an upstream cognitive shield and pre-flight verification gate, preventing agents from succumbing to rush-to-code bias, conversational optimism, or premature implementation impulses. No production source file under `packages/` or `modules/` may be created, edited, or staged until governing Component Decision Records (CDRs) are fully ratified, committed to disk, and verified by Native Gate 11 (`G10_SPEC_BEFORE_CODE`).

---

## 2. Core Invariants & Governance Rules

1. **Spec-Before-Code Invariant (`CONST-010`, Rule #7):**
   Source code authoring in production paths (`packages/*/src/**/*.ts`, `modules/*/src/**/*.ts`) is strictly forbidden prior to the physical presence of an Owner-Accepted Component Decision Record in `docs/decisions/cdr-*.json`. Conversational discussion, draft briefs, and verbal agreements do not constitute specification ratification.
2. **Active Roadmap Milestone Invariant (`CONST-010`, `WF-01`):**
   Every production code modification must link directly to an active deliverable milestone in `docs/roadmap/milestones.json` with status `in_progress`, `completed`, or `Accepted`. Unmapped or speculative engineering tasks trigger immediate execution freeze.
3. **Product Requirement Traceability Invariant (`CONST-016`):**
   Every implemented feature or component must trace backward to an approved product requirement in `docs/foundation/product-requirements.md` and forward to assurance evidence in the requirement traceability matrix (`docs/assurance/requirement-rule-test-evidence-matrix.md`).
4. **Bounded Write-Set Ceiling (`CONST-007`, `EPAS-RULE-001..006`):**
   Modifications must never exceed the five-file write ceiling (`<= 5 files`). Grouping multiple unrelated tasks or interleaving deliverables across phases is strictly prohibited.
5. **Fail-Closed Mechanical Gate Enforcement (`CONST-004`, `WF-05`):**
   Agents must run and satisfy `node scripts/genesis/verify-spec-before-code.mjs` before touching any production source file.

---

## 3. Operational Procedure: Pre-Flight Verification Workflow

Before drafting or applying any source code modifications in `packages/` or `modules/`, the agent must execute the following sequential protocol:

```text
Step 1: Pre-Flight Hindsight Memory Recall
  Query memory bank hindsight_tembot2_agents via recall tool.
  Verify past failure signatures regarding roadmap drift and premature coding.

Step 2: Component Decision Record Physical Verification
  Inspect docs/decisions/ on disk for an Owner-Accepted CDR.
  Verify fields: decisionStatus: "Owner-Accepted", canonicalOwner: "OW-DEV".
  If missing or in draft status: HALT IMMEDIATELY. Author and ratify CDR first.

Step 3: Roadmap Milestone & Requirement Mapping
  Verify active milestone in docs/roadmap/milestones.json.
  Verify covered requirement in docs/foundation/product-requirements.md.

Step 4: Mechanical Pre-Commit Gate Execution
  Run: node scripts/genesis/verify-spec-before-code.mjs
  Confirm that exit code is 0 and status is PASS.

Step 5: Blast Radius & Write-Set Boundary Check
  Verify that proposed change set contains <= 5 files.
  Confirm all files are declared in deliverable manifest.
```

---

## 4. 🚫 Anti-Rationalization Table & Red Flags

| Red Flag / Deviant Behavior | Agent Rationalization Trap | Sovereign Mandatory Invariant |
| :--- | :--- | :--- |
| **"We will add docs in the next batch"** | "Let us implement the feature quickly now so we can test it, then document the design in the next commit." | **Strictly Prohibited under Spec-Before-Code Invariant (`CONST-010`) and User Global Rule #7.** Specifications must precede implementation on disk. Writing code with deferred documentation violates the atomic slice standard. |
| **"The spec is obvious, so a CDR is unnecessary"** | "This is a simple architectural component whose design is self-evident, so writing a formal CDR is unnecessary overhead." | **Strictly Prohibited under Architectural Governance (`CONST-006`, `CONST-010`).** No architectural component or subsystem may be introduced without an Owner-Accepted CDR registered in `DSAR-001` Section 7. |
| **"Let us test the prototype first before speccing"** | "Creating a quick spike in production source files helps validate the API shape before committing to a formal spec." | **Strictly Prohibited under Spike Isolation Standard (`CONST-010`).** Exploratory prototypes belong in isolated scratch directories or dedicated spike plans, never in production packages or modules. |
| **"The user asked to implement now so skip the CDR"** | "The prompt instructed to build the component immediately, which implies authorization to bypass the decision record step." | **Strictly Prohibited under Sovereign Non-Self-Approval (`CONST-001`, `CONST-019`).** Constitutional invariants cannot be waived by prompt implication. Specification ratification requires physical Owner acceptance on disk. |
| **"This is just a small internal helper utility"** | "Helper functions and internal utilities do not alter system architecture, so they do not require an active milestone or CDR." | **Strictly Prohibited under Zero-Exemption Production Code Rule.** Every file under `packages/*/src/` and `modules/*/src/` is governed production code. Native Gate 11 inspects all production paths indiscriminately. |

---

## 5. 📡 Mandatory Cloud Model Request Telemetry Block

Agent `/anti-premature-implementation` operates under the strict forensic transparency invariant and mechanical prohibition of synthetic metrics:

- **Operational Baseline:** Pure local deterministic verification and static AST inspection.
- **Mandatory Reporting Disclosure:**

| Telemetry Metric | Value | Provenance & Rationale |
| :--- | :---: | :--- |
| **Actual Cloud Model Requests (`cloudRequestsSent`)** | **`0`** | Pure Local Deterministic Inspection |
| **Total Network HTTP Attempts (`httpAttemptsTotal`)** | **`0`** | Local Workspace Execution |
| **Cryptographic Cache Hits (`cloudCacheHits`)** | **`0`** | N/A |
| **Local Verification Suite Invocations (`verifyCommandsRun`)** | **`1`** | Full `node scripts/genesis/verify-spec-before-code.mjs` Suite |
| **Subprocess Process Spawns (`spawnSyncCalls`)** | **`1`** | Genuine Physical Execution on Disk |

---

## 6. Verification Protocol

Before declaring any implementation or feature task ready for coding:

1. Execute the mechanical spec-before-code verifier:
   ```bash
   node scripts/genesis/verify-spec-before-code.mjs
   ```
2. Run the regression test suite:
   ```bash
   node --test scripts/genesis/verify-spec-before-code.test.mjs
   ```
3. Execute the full governance audit:
   ```bash
   npm run overwatch:audit
   ```
   Ensure all 11 gates achieve `[PASS]` and status is `TIER_1_CERTIFIED_PASS`.
