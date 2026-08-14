---
title: Backup Management
description: How super admins create, verify, restore, and reset Tempot backups from the bot
tags:
  - user-guide
  - backup
  - restore
audience:
  - operator
  - super-admin
contentType: user-guide
difficulty: intermediate
---

## Overview

Backup management is a super-admin capability. It protects the local project
database and storage files by creating encrypted backup artifacts inside the
configured project backup directory.

## Create a Backup

To create a backup from the bot:

1. Open the main menu with `/start`.
2. Open Backups.
3. Press Create backup.
4. Wait for the completion message.

The success message shows the backup reference and file name. Local backup files
are stored under the configured local backup directory in the project workspace.
The file name includes the date and time so operators can identify the correct
artifact later.

## View Backup History

Use Backup history to list recent backup operations. The history should be used
before restore operations to identify the backup reference and creation time.

## Run a Restore Check

The Restore saved backup button runs a restore check first. It validates the
selected backup in an isolated restore target and does not overwrite the live
database during this check.

To run the restore check:

1. Open Backups.
2. Press Restore saved backup.
3. Select the backup to restore.
4. Confirm the restore check.
5. Wait for the restore check result.

After a successful check, the bot shows the Live restore action for the checked
backup.

## Live Restore

Live restore is a destructive operational action. It creates a fresh
pre-restore backup first, then replaces the live database and configured live
files from the selected backup. The bot requires two additional confirmations
before executing the live restore. It is restricted to super admins and should
be executed only after confirming the selected backup is the intended artifact.

## Factory Reset

Factory reset returns the database to an initial state. It creates a fresh
pre-reset backup first, then removes existing users, memberships, messages,
settings, and audit records. It relies on `SUPER_ADMIN_IDS` to recreate the
super-admin account after the bot container restarts. Use factory reset only
when a clean local state is required.
