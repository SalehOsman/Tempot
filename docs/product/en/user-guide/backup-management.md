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

## Restore a Saved Backup

To restore a saved backup:

1. Open Backups.
2. Press Restore saved backup.
3. Select the backup to restore.
4. Confirm the restore warning.
5. Complete the final confirmation step.

Real restore is a destructive operational action. It is restricted to super
admins and should be executed only after confirming the selected backup is the
intended artifact.

## Restore Check

Restore check validates that a backup can be read and verified without replacing
the active database. Use it before a real restore whenever possible.

## Factory Reset

Factory reset returns the database to an initial state. It removes existing
users and relies on `SUPER_ADMIN_IDS` to recreate the super-admin account on the
next startup or bootstrap flow. Use factory reset only when a clean local state
is required.
