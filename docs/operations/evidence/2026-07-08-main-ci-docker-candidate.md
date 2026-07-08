# Main CI And Docker Candidate Evidence - 2026-07-08

## Release Identity

- **Scope:** Post-merge evidence for the current `main` candidate after the
  Spec #058 bot access mode and membership gate merge plus CI repair.
- **Git commit:** `47f59ea9080ac58c698d16bbf6c117cb3c74237a`.
- **GitHub CI run:** `28950023839`.
- **GitHub Docker run:** `28950023763`.
- **Image reference:** `ghcr.io/salehosman/tempot-bot-server@sha256:a1424b3d42d69a0117c6b2612b54b60ae4710c9439b3d2f05cf7872c34a10bae`.
- **Date:** 2026-07-08.
- **Operator:** Codex, acting under Project Manager approval.

## CI Evidence

GitHub Actions CI run `28950023839` completed successfully on `main` for commit
`47f59ea9080ac58c698d16bbf6c117cb3c74237a`.

Completed successful jobs:

- Methodology Gates.
- Lint.
- Security Audit.
- Type Check on Node.js 22.12.0.
- Type Check on Node.js 24.
- Unit Tests on Node.js 22.12.0.
- Unit Tests on Node.js 24.
- Integration Tests.
- Coverage.

The `Changeset Status` job was skipped because the run was triggered by a push
to `main`; that job is PR-only and is not a `main` failure.

## Docker And Supply Chain Evidence

GitHub Actions Docker run `28950023763` completed successfully on `main` for
commit `47f59ea9080ac58c698d16bbf6c117cb3c74237a`.

The workflow:

- built and pushed `ghcr.io/salehosman/tempot-bot-server:main`;
- tagged the same image as `ghcr.io/salehosman/tempot-bot-server:sha-47f59ea`;
- emitted immutable digest
  `sha256:a1424b3d42d69a0117c6b2612b54b60ae4710c9439b3d2f05cf7872c34a10bae`;
- ran Trivy scanning for High and Critical findings;
- uploaded the scan report;
- signed the immutable digest with Cosign;
- verified the Cosign signature for the immutable digest.

## Decision

- **Candidate state:** Valid current `main` candidate for staging selection.
- **Production decision:** No-Go.
- **Reason:** This evidence proves the current `main` code, CI, Docker build,
  scan, signing, and signature verification. It does not prove external staging
  deployment, public Telegram webhook delivery, staging monitoring and alerting,
  target-environment backup and restore, rollback or forward-fix rehearsal, or
  final Product Manager go/no-go approval.

## Remaining Required Evidence

Before production approval, record separate target-environment evidence for:

1. deploying the selected immutable digest to external staging;
2. applying migrations against the staging database;
3. verifying public `/live` and restricted `/ready`;
4. verifying Telegram webhook delivery through a public URL;
5. capturing monitoring and alert behavior;
6. rehearsing target backup and restore;
7. rehearsing rollback or forward-fix according to the migration compatibility
   record;
8. completing final review and Product Manager go/no-go.
