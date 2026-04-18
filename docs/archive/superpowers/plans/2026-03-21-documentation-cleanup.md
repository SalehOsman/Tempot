# Documentation Cleanup & Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clean up documentation by adding missing ADRs, consolidating UX rules into a unified guide, and purging deprecated workflow references.

**Architecture:** Documentation-only changes. Consolidating scattered rules into `docs/guides/UX-STYLE-GUIDE.md` and adding formal Architectural Decision Records (ADRs 026-029).

**Tech Stack:** Markdown, Git.

---

### Task 1: Create Missing ADRs (026-029)

**Files:**

- Create: `docs/architecture/adr/ADR-026-neverthrow-result-pattern.md`
- Create: `docs/architecture/adr/ADR-027-pino-logging.md`
- Create: `docs/architecture/adr/ADR-028-testing-strategy-vitest.md`
- Create: `docs/architecture/adr/ADR-029-zod-validation.md`
- Modify: `README.md` (ADR Index section)

- [ ] **Step 1: Create ADR-026 (neverthrow)**
- [ ] **Step 2: Create ADR-027 (Pino)**
- [ ] **Step 3: Create ADR-028 (Vitest/Testcontainers)**
- [ ] **Step 4: Create ADR-029 (Zod)**
- [ ] **Step 5: Update ADR index table in `README.md` to include ADRs 026-029 and reconcile the total count.**
- [ ] **Step 6: Commit ADR changes**

```bash
git add docs/architecture/adr/*.md README.md
git commit -m "docs: add missing ADRs 026-029 and update index"
```

---

### Task 2: Consolidate UX/UI Rules

**Files:**

- Create: `docs/guides/UX-STYLE-GUIDE.md`
- Modify: `README.md` (Documentation links)
- Modify: `docs/guides/RTL-GUIDELINES.md` (Mark as deprecated/legacy)

- [ ] **Step 1: Create unified UX guide with rules for Status Messages, Button Standards, RTL Pairing, and Edit Message Golden Rule. Use `docs/guides/RTL-GUIDELINES.md`, Constitution (LXIV-LXIX), and `tempot_v11_final.md` as sources.**
- [ ] **Step 2: Update `docs/guides/RTL-GUIDELINES.md` to point to the new UX Style Guide and mark as legacy.**
- [ ] **Step 3: Update `README.md` to link to the new UX Style Guide.**
- [ ] **Step 4: Commit UX consolidation**

```bash
git add docs/guides/UX-STYLE-GUIDE.md docs/guides/RTL-GUIDELINES.md README.md
git commit -m "docs: consolidate UX/UI rules into unified style guide"
```

---

### Task 3: Purge Deprecated Workflow References

**Files:**

- Modify: `docs/developer/workflow-guide.md`
- Modify: `docs/tempot_v11_final.md` (Arabic context preservation)
- Modify: `docs/guides/TESTING-STRATEGY-EXTENDED.md`

- [ ] **Step 1: Search and replace `/speckit.tasks` and `/speckit.implement` with `superpowers` workflow references in `docs/`.**
- [ ] **Step 2: In `docs/tempot_v11_final.md`, update Section 22 to the new 11-step lifecycle while preserving the Arabic language and context.**
- [ ] **Step 3: Verify no remaining matches in `docs/` using grep.**
- [ ] **Step 4: Commit purge changes**

```bash
git add docs/
git commit -m "docs: purge deprecated speckit workflow references"
```
