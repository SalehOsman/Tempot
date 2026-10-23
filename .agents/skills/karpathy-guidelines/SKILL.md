---
name: karpathy-guidelines
description: Andrej Karpathy first-principles software engineering and AI agent simplicity doctrine. Enforces radical simplicity, minimal surface area, trivial unmocked baselines first, and zero mystery abstractions.
tools:
  - read_file
  - edit_file
  - write_file
---

# Sovereign Architecture Discipline: Karpathy Guidelines

> **Skill Target:** Radical Simplicity & First-Principles Systems Engineering
> **Taxonomy Classification:** Category 1: Architecture Patterns (`skills-vault/1-architecture-patterns/`)
> **Constitutional Authority:** `FD02-CONSTITUTION-001` (`CONST-001`, `CONST-007`, `CONST-010`, `CONST-016`, `CONST-020`), User Global Rules #4, #10, #14
> **Upstream Lineage:** Derived from Andrej Karpathy's software design philosophy and micro-framework doctrines
> **Guiding Doctrine:** **Radical simplicity, minimal surface area, transparent data flow, trivial unmocked baselines first, and absolute refusal of mystery abstractions.**

---

## 1. Purpose & Core Doctrine

The **Karpathy Guidelines** enforce the discipline of radical simplicity and first-principles software engineering across all codebase architectures. In modern software development, engineers and AI models frequently succumb to premature abstraction, architectural bloat, and dependency inflation. They erect massive layer cakes of design patterns, wrappers, and configuration scaffolding before solving the actual computational problem.

This skill mandates that systems must be built from first principles:
- **Understand Every Line:** If you cannot explain the mechanical purpose of every line, function, and parameter in your codebase, you do not own the code.
- **Surface Area Discipline:** Keep the public surface area of modules as small as possible. The best code is code that does not need to exist.
- **Transparent Data Flow:** Prefer flat, inspectable data transformations over deeply nested polymorphic inheritance graphs.

```text
+---------------------------------------------------------------------------------------+
|                            THE KARPATHY ENGINEERING SPIRAL                            |
+---------------------------------------------------------------------------------------+
|  1. TRIVIAL BASELINE   --> Dumbest possible unmocked end-to-end working pipeline     |
|  2. MECHANICAL MASTERY --> Inspect raw values, verify byte-level state transitions    |
|  3. SURGICAL UPGRADE   --> Add one capability at a time, profiling complexity impact  |
|  4. DEP-HYGIENE        --> Standard library primitives over heavy third-party baggage |
|  5. FAST LOOPS         --> Instant test runs and physical execution without overhead  |
+---------------------------------------------------------------------------------------+
```

---

## 2. The Five Karpathy Axioms

Every module, component, and algorithm authored within the system must align with the Five Karpathy Axioms:

### Axiom 1: Start With a Trivial Working Baseline
Never design an elaborate distributed architecture, generic interface lattice, or plugin hierarchy at the outset.
- Begin with the simplest, dumbest, unmocked end-to-end implementation that solves the core problem.
- Verify that this baseline works physically on disk and delivers verifiable output.
- Only once a baseline is running and measured do you incrementally introduce necessary complexity.

### Axiom 2: Understand Every Line of Code
Code comprehension is a non-negotiable security and reliability requirement.
- Do not paste multi-hundred-line utility snippets, StackOverflow solutions, or AI-generated boilerplate without understanding every conditional branch and edge case.
- Every variable must have clear, legible semantics.
- Magic constants, obscure bitwise tricks without commentary, and unexplained side effects are strictly forbidden.

### Axiom 3: Zero Copy-Pasted Mystery Abstractions
Reject the temptation to wrap libraries or protocols in multiple layers of indirection.
- If a standard library function or simple function call suffices, do not construct a factory, builder, provider, or adapter pattern around it.
- Never introduce an abstraction to "hide" complexity unless that abstraction provides genuine computational encapsulation and passes the Rule of Three.

### Axiom 4: Minimize External Dependencies
External dependencies are permanent operational liabilities: they inflate attack surfaces, introduce supply-chain vulnerabilities, break across runtime upgrades, and obscure runtime behavior.
- Always ask: "Can this capability be built in 30 lines of clean, native standard library code?"
- If the answer is yes, build it natively rather than adding an npm package.
- Every external dependency requires explicit architectural justification and security vetting.

### Axiom 5: Surgical Changes with Fast Verification Loops
High-velocity engineering depends on rapid feedback loops.
- Avoid large monolithic pull requests that mutate twenty files simultaneously.
- Keep modifications small, cohesive, and surgically targeted.
- Structure test suites so that unit and integration checks execute in milliseconds, allowing developers to run tests on every file save without friction.

---

## 3. Anti-Complexity Discipline

System complexity is not an asset; it is a technical tax that compounds across the lifecycle of software.

1. **Complexity Budgeting:**
   Each module possesses a strict complexity budget. If a feature increases cognitive load or cyclomatic complexity without a commensurate increase in capability, it must be rejected.
2. **Favor Flat Over Nested:**
   Deeply nested module structures, five-level inheritance trees, and indirect callback chains obscure execution traces. Prefer flat architectures where data flows sequentially through pure functions.
3. **Prefer Native Standard Library Primitives:**
   Node.js standard libraries (`node:fs`, `node:path`, `node:crypto`, `node:child_process`, `node:test`) provide battle-tested, high-performance, zero-overhead primitives. Leverage native capabilities instead of reaching for third-party helper libraries.

---

## 4. Anti-Premature Abstraction (The Rule of Three)

Premature abstraction is the root of convoluted, unmaintainable software architectures:

1. **The Rule of Three Invariant:**
   Never extract a shared abstraction, generic framework, or universal helper until you have at least three distinct, production-grade, concrete use cases physically implemented in the codebase.
2. **Duplication is Cheaper Than the Wrong Abstraction:**
   Two instances of similar code are vastly preferable to a premature, generalized helper that forces divergent requirements into an unnatural shared interface.
3. **Delete Speculative Hooks:**
   Do not introduce configuration flags, parameter switches, or extension points for hypothetical future requirements. Implement only what is required today.

---

## 5. 🚫 Anti-Rationalization Table & Red Flags

| Red Flag / Deviant Behavior | Agent Rationalization Trap | Sovereign Mandatory Invariant |
| :--- | :--- | :--- |
| **"Building a universal generic framework first"** | "If I build a generic extensible plugin engine first, implementing this specific feature and future features will be trivial." | **Strictly Prohibited under Anti-Premature Abstraction & Axiom 1.** Building generic frameworks before concrete implementations produces bloated, misaligned architectures. Build the concrete, unmocked baseline first. Abstractions are earned, not assumed. |
| **"Adding a third-party package for trivial utilities"** | "Installing an npm package for string manipulation, path parsing, or slugification saves 5 minutes of implementation time." | **Strictly Prohibited under Axiom 4 & Zero Unapproved Dependencies (`ADR-002`, `RUF-001..004`).** Every third-party package adds maintenance, license, and security exposure. Trivial operations must be written cleanly using native standard library primitives. |
| **"Wrapping libraries in unnecessary abstraction layers"** | "Creating an abstract facade, factory, and interface wrapper makes our code enterprise-ready and decouples us from the underlying tool." | **Strictly Prohibited under Axiom 3 (Zero Mystery Abstractions).** Unnecessary indirection layers obfuscate debugging, complicate stack traces, and double maintenance overhead without delivering architectural value. Keep wrappers minimal and purposeful. |
| **"Copy-pasting ungrounded boilerplate code"** | "This 200-line utility helper is standard across many projects, so I can paste it in without reading every detail." | **Strictly Prohibited under Axiom 2 (Understand Every Line).** Incorporating ungrounded code introduces latent bugs, unexpected dependencies, and security flaws. Every line must be understood, intentional, and verified on disk. |
| **"Premature optimization before measuring baseline"** | "I should implement a multi-level caching system and asynchronous batching queue now to ensure this operation is high-performance." | **Strictly Prohibited under Axiom 1 & First-Principles Doctrine.** Premature optimization introduces complex concurrency and invalidation bugs. Implement the simplest correct working solution first, benchmark it, and optimize only when profiling reveals a bottleneck. |

---

## 6. 📡 Mandatory Cloud Model Request Telemetry Block

Agent `/karpathy-guidelines` operates under the strict forensic transparency invariant and mechanical prohibition of synthetic metrics:

- **Operational Baseline:** Pure local deterministic execution, native standard library verification, and direct AST analysis.
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

Before declaring any architectural design or component implementation compliant with Karpathy Guidelines:

1. Execute canonical byte formatting verification:
   ```bash
   node scripts/genesis/verify-canonical-bytes.mjs
   ```
2. Inspect package boundaries and dependencies to ensure zero unauthorized packages were introduced:
   ```bash
   node scripts/genesis/verify-package-boundaries.mjs
   ```
3. Audit cyclomatic complexity and line depth to verify minimal surface area:
   ```bash
   node scripts/genesis/verify-code-complexity.mjs
   ```
4. Verify that working-tree blast radius adheres strictly to the 5-file bounded ceiling:
   ```bash
   node scripts/genesis/verify-blast-radius.mjs
   ```
