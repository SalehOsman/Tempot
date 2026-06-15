---
"bot-server": patch
---

Repository hygiene and toolchain alignment (analysis 2026-06-10):

- Toolchain pinning (`packageManager` and `engines.pnpm`) is deferred to
  Spec #056 because the current local/CI pnpm versions diverge and
  `pnpm/action-setup@v5` cannot accept both `version` and `packageManager`.
- Align CI Node version to `22` to match `engines`, Dockerfile `node:22-alpine`,
  README, AGENTS.md, and the Constitution.
- Translate the only non-English comment in `apps/bot-server/src/index.ts`
  (Constitution Rule I).
- Remove the obsolete "TODO Phase 5" comment from `docker-compose.yml`.
- Move legacy `project_status_report.md` into `docs/project-analysis/`.
- Remove orphaned `packages/.gitkeep` (workspace is no longer empty).
- Untrack the local `bot-terminal.log` runtime artifact.
- ROADMAP: link to the new `docs/analysis-2026-06-10/` analysis and stop
  listing `pnpm docs:freshness` as an existing gate; it is documented as a
  Spec #056 deliverable instead.
- Documentation: align `README.md` and `CONTRIBUTING.md` to pnpm 11+.

No production runtime behavior is modified. Specs #053-#057 remediation
program is unchanged.
