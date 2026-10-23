---
name: grill-me
description: Adversarial specification grilling and interactive design interrogation. Relentlessly pressure-tests requirements, architectural trade-offs, edge cases, and failure domains before code modification.
tools:
  - run_command
  - read_file
  - ask_question
---

# Sovereign Specification Interrogation Discipline: Grill-Me

> **Skill Target:** Adversarial Pre-Flight Design Interrogation & Requirement Pressure-Testing
> **Taxonomy Classification:** Category 6: Operations and Lifecycle (`skills-vault/6-operations-and-lifecycle/`)
> **Constitutional Authority:** `FD02-CONSTITUTION-001` (`CONST-001`, `CONST-006`, `CONST-007`, `CONST-010`, `CONST-016`, `CONST-019`, `CONST-020`), User Global Rules #2, #7, #10, #14
> **Upstream Lineage:** Derived from `mattpocock/grill-me` adversarial design interview methodologies
> **Guiding Doctrine:** **Zero implementation on ambiguous requirements, zero unexamined architectural assumptions, relentless interrogation of edge cases, and mandatory multi-choice trade-off resolution.**

---

## 1. Purpose & Core Doctrine

The **Grill-Me Adversarial Interrogation Discipline** stops the single most expensive error in software engineering: building the wrong thing brilliantly. When requirements are vague or underspecified, engineers and AI agents routinely fill the gaps with unspoken, optimistic assumptions. These assumptions inevitably mutate into architectural debt, broken edge cases, and post-deployment regressions.

Grill-Me turns the pre-flight planning phase into an active adversarial gauntlet:
- **Relentless Pressure-Testing:** Interrogate every requirement until all implicit assumptions are extracted, examined, and converted into explicit technical invariants.
- **Trade-Off Articulation:** Force every design choice to declare its cost. Every architectural decision is an exchange of trade-offs, never a pure benefit.
- **No Coding While Ambiguity Remains:** Source code authoring is strictly frozen until all four rounds of the grilling gauntlet are completed and ratified by the human architect.

```text
+---------------------------------------------------------------------------------------+
|                               THE 4-ROUND GRILLING GAUNTLET                           |
+---------------------------------------------------------------------------------------+
|  ROUND 1: CORE PROBLEM & NON-GOALS  --> What exact problem are we solving? Non-goals? |
|  ROUND 2: BOUNDARIES & DATA FLOW    --> Exact inputs, outputs, schemas, mutations?    |
|  ROUND 3: EDGE CASES & ABUSE MODES  --> Concurrency, network partition, corrupted data|
|  ROUND 4: VERIFICATION & ROLLBACK   --> Unmocked tests, failure detection, undo plan? |
+---------------------------------------------------------------------------------------+
```

---

## 2. The 4-Round Grilling Gauntlet

Before any work plan is authored or source file modified, the interrogating agent must subject the proposed change to the four sequential rounds of the gauntlet:

### Round 1: Core Problem & Non-Goals
1. **The Root Need:**
   What exact human or system problem is being solved? Who is the user, and what is their concrete friction?
2. **Explicit Non-Goals:**
   What are we deliberately NOT doing in this iteration? Explicitly bounding what is out of scope prevents scope creep and feature bloat.
3. **Alternative Rejection:**
   What other approaches were considered, and why were they rejected? Why does this solution earn its place in the codebase?

### Round 2: Boundary Invariants & Data Flow
1. **Exact I/O Contracts:**
   What are the precise input types, output types, and validation schemas? Where does data enter, transform, and persist?
2. **State Mutation Invariants:**
   What state is created, updated, or destroyed? Are mutations idempotent? Does the operation require distributed transactions or database locks?
3. **Blast Radius Constraints:**
   What other modules or packages could possibly be affected by this change? How is the blast radius mechanically bounded (`<= 5 files` under `CONST-007`)?

### Round 3: Edge Cases, Failure Modes & Abuse Vectors
1. **Hostile Input & Malformed Payloads:**
   What happens when inputs are empty strings, extreme numbers, unexpected UTF-8 sequences, or oversized buffers?
2. **Operational Failures:**
   What happens when the database connection drops halfway through the operation? What if the disk is full, the network times out, or the process receives a termination signal?
3. **Concurrency & Race Conditions:**
   What happens if two concurrent requests attempt this mutation simultaneously? Is double-spending or duplicate insertion prevented mechanically?

### Round 4: Verification Contract & Rollback Plan
1. **Deterministic Verification:**
   How will we prove physically on disk that this change works? What exact terminal command and test assertion confirms success with exit code 0?
2. **Anti-Vanity Test Contract:**
   Does the test assert concrete database mutations and state transitions, or is it merely asserting that a synthetic mock was called?
3. **Rollback & Reversibility:**
   If this feature causes an outage in production, what is the exact rollback sequence? Can database migrations be rolled back without data loss?

---

## 3. Interactive Multiple-Choice Interrogation

When interviewing the human architect, agents must never ask trivial, lazy, or open-ended questions that dump cognitive load back onto the human:

1. **Concrete Multiple-Choice Framing:**
   Present structured options where each choice embodies a distinct, defensible engineering trade-off:
   - Prohibited: "How would you like to handle errors?"
   - Enforced: "When token validation fails, should we:
     - Option A (Fail-Closed): Immediately terminate with HTTP 401 and log security telemetry.
     - Option B (Graceful Degrade): Fall back to unauthenticated public guest permissions.
     - Option C (Challenge Mode): Redirect to OAuth interactive login challenge."
2. **Recommendation Prefixing:**
   Always indicate the recommended option based on constitutional invariants, prefixing with `(Recommended)`.
3. **Never Ask Yes/No Questions:**
   Binary yes/no questions obscure trade-offs and encourage passive rubber-stamping. Frame questions around architectural consequences.

---

## 4. Spec Ratification Threshold

No source code or architectural documentation may be staged until the interrogation reaches formal ratification:

1. **Zero Unresolved Unknowns:**
   Every open question raised during the four grilling rounds must be resolved with an explicit, documented decision.
2. **Owner-Accepted Decision Record:**
   For any substantial architectural or component change, the conclusions of the grilling gauntlet must be captured in a Component Decision Record (CDR) committed to `docs/decisions/` and accepted by the Sovereign Owner.
3. **Immunity to Prompt Implication:**
   A prompt asking to "just build it now" does not waive the grilling requirement when requirements remain ambiguous. Constitutional integrity requires grounded clarity.

---

## 5. 🚫 Anti-Rationalization Table & Red Flags

| Red Flag / Deviant Behavior | Agent Rationalization Trap | Sovereign Mandatory Invariant |
| :--- | :--- | :--- |
| **"Assuming the requirement is obvious"** | "The user's prompt is clear enough to start coding immediately; grilling them with questions will only slow down progress." | **Strictly Prohibited under Pre-Flight Interrogation Protocol.** Ambiguity is invisible until probed. Rushing to code on unexamined assumptions leads to rework and regressions. Every design must survive the 4-Round Gauntlet. |
| **"Asking open-ended or trivial yes/no questions"** | "Asking 'Do you want me to write tests?' or 'What should the schema look like?' gives the user complete control." | **Strictly Prohibited under Interactive Interrogation Standard.** Agents must do the heavy lifting: synthesize concrete trade-offs, formulate distinct options, and provide recommendations rather than dumping open-ended questions. |
| **"Proceeding while edge cases remain unresolved"** | "We can implement the happy path first and figure out timeout handling and database rollback later if problems arise." | **Strictly Prohibited under Round 3 & Round 4 Invariants.** Deferred failure handling causes production outages. Error paths, concurrency races, and rollback plans must be determined prior to coding. |
| **"Self-approving architectural trade-offs"** | "I decided Option A is best, so I will proceed with Option A without presenting the trade-offs to the human architect." | **Strictly Prohibited under Sovereign Non-Self-Approval (`CONST-001`, `CONST-019`).** AI agents are strictly forbidden from self-authorizing trade-offs. The human architect holds supreme authority over system design choices. |
| **"Bypassing grilling because of a tight deadline"** | "The user asked for this urgently, so there is no time to run through the 4-Round Grilling Gauntlet." | **Strictly Prohibited under Constitutional Primacy (`CONST-001`, `CONST-010`).** Speed at the expense of verified requirements creates instant technical debt. Bounded, structured interrogation saves hours of downstream defect repair. |

---

## 6. 📡 Mandatory Cloud Model Request Telemetry Block

Agent `/grill-me` operates under the strict forensic transparency invariant and mechanical prohibition of synthetic metrics:

- **Operational Baseline:** Pure local deterministic execution, structured multi-turn interrogation, and static design verification.
- **Mandatory Reporting Disclosure:**

| Telemetry Metric | Value | Provenance & Rationale |
| :--- | :---: | :--- |
| **Actual Cloud Model Requests (`cloudRequestsSent`)** | **`0`** | Pure Local Deterministic Inspection |
| **Total Network HTTP Attempts (`httpAttemptsTotal`)** | **`0`** | Local Workspace Execution |
| **Cryptographic Cache Hits (`cloudCacheHits`)** | **`0`** | N/A |
| **Local Verification Suite Invocations (`verifyCommandsRun`)** | **`1`** | Canonical Byte & Architecture Verifier |
| **Subprocess Process Spawns (`spawnSyncCalls`)** | **`1`** | Genuine Physical Execution on Disk |

---

## 7. Verification Protocol

Before declaring any specification, interview session, or requirement contract finalized:

1. Execute canonical byte formatting verification:
   ```bash
   node scripts/genesis/verify-canonical-bytes.mjs
   ```
2. Inspect the work plan or Component Decision Record on disk for zero unresolved placeholder tokens:
   ```bash
   node -e "const fs = require('fs'); /* verify zero placeholders in decision record */"
   ```
3. Verify that working-tree modifications conform strictly to the 5-file bounded ceiling:
   ```bash
   node scripts/genesis/verify-blast-radius.mjs
   ```
