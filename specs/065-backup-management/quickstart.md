# Quickstart: Backup Management

This quickstart is the expected acceptance path after implementation.

## Prerequisites

- PostgreSQL and Redis are running.
- Storage destination is configured through the approved storage boundary.
- Protected-data key configuration is available through the approved secret
  boundary.
- `SUPER_ADMIN_IDS` contains the Telegram user used for acceptance testing.
- `TEMPOT_BACKUP=true`.

## Local Acceptance Flow

1. Start the bot runtime.
2. Open the super-admin menu.
3. Open Backup Management.
4. Confirm the empty state is explicit when no backup exists.
5. Request a complete backup.
6. Verify the backup status moves from pending to running to succeeded or a
   safe failure state.
7. Open backup detail.
8. Confirm manifest, integrity state, scope, timestamps, and safe artifact
   metadata are visible.
9. Run restore rehearsal against an isolated target.
10. Confirm live database and live storage are unchanged.
11. After a successful rehearsal, choose live restore only for a deliberate
    recovery test or real recovery window.
12. Confirm the first live-restore warning.
13. Confirm the final live-restore warning.
14. Confirm a fresh pre-restore backup is created before live restore starts.
15. Confirm live database migrations are reapplied before restore completion.
16. Confirm the evidence summary reports backup integrity and restore results.
17. Confirm authorized operators receive safe notifications.
18. Confirm audit records exist for every state-changing operation.
19. For a factory-reset drill only, run database factory reset.
20. Confirm the pre-reset backup identifier is shown.
21. Restart the bot container and confirm the super admin is recreated from
    `SUPER_ADMIN_IDS`.

## Required Evidence

Record the result under `docs/operations/evidence/` with:

- runtime image or commit identifier;
- source environment classification;
- backup job identifier;
- artifact checksum summary;
- restore target classification;
- restore rehearsal result;
- live restore result, when executed;
- pre-restore backup identifier, when live restore is executed;
- factory reset result, when executed;
- pre-reset backup identifier, when factory reset is executed;
- protected-data readability result;
- file coverage result;
- notification result;
- audit result;
- known limitations.

## Failure Acceptance

The feature is not acceptable if:

- an artifact containing protected data is stored as plaintext;
- a restore rehearsal can target the live environment;
- live restore can run without a successful isolated rehearsal;
- live restore can run without a fresh pre-restore backup;
- factory reset can run without a fresh pre-reset backup;
- factory reset preserves ordinary users instead of relying on
  `SUPER_ADMIN_IDS` bootstrap after restart;
- a failed backup does not alert an authorized operator;
- a Telegram handler performs backup execution directly;
- backup artifacts are stored through direct provider calls from the module;
- the latest usable complete backup can be deleted by retention.
