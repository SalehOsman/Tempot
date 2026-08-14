# Sensitive Data Classification

**Spec**: #054 Sensitive Data Protection
**Status**: Approved by the Project Manager on 2026-06-08
**Last reviewed**: 2026-06-08

## Scope

This inventory records the user identity and contact fields confirmed in the
current Prisma schema and the paths that can copy those fields into persistent
or external observability systems. It is the approval artifact for task T002.

The first protection wave covers `email`, `nationalId`, `mobileNumber`, and
`birthDate`. Adjacent personal fields remain subject to audit and logging
minimization even when application-level encryption is not introduced by this
spec.

## Classification Levels

| Level        | Definition                                                                       | Required handling                                                                           |
| ------------ | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Restricted   | Identity data that materially enables impersonation or identity verification     | Encrypt at the application layer, omit from logs and audit values, tightly control recovery |
| Confidential | Direct contact data or sensitive profile data                                    | Encrypt when in first-wave scope, omit from logs and audit values                           |
| Personal     | User-linked identifiers or profile attributes needed by normal application flows | Minimize exposure, omit from whole-entity audit snapshots, do not log raw values            |
| Operational  | Non-secret state needed to operate or authorize the application                  | Allow only for documented business, audit, or diagnostic use                                |

## Field Inventory

| Field              | Schema evidence                              | Classification                  | Lookup                                  | Approved representation                      | Audit policy                                   |
| ------------------ | -------------------------------------------- | ------------------------------- | --------------------------------------- | -------------------------------------------- | ---------------------------------------------- |
| `nationalId`       | `packages/database/prisma/base.prisma:26`    | Restricted                      | Exact match and uniqueness              | AES-256-GCM envelope plus HMAC-SHA-256 token | Field name and change kind only                |
| `birthDate`        | `packages/database/prisma/base.prisma:28`    | Restricted                      | None                                    | AES-256-GCM envelope                         | Field name and change kind only                |
| `email`            | `packages/database/prisma/base.prisma:21`    | Confidential                    | Exact match only after migration        | AES-256-GCM envelope plus HMAC-SHA-256 token | Field name and change kind only                |
| `mobileNumber`     | `packages/database/prisma/base.prisma:27`    | Confidential                    | No exact lookup in this protection wave | AES-256-GCM envelope only                    | Field name and change kind only                |
| `telegramId`       | `packages/database/prisma/base.prisma:19`    | Personal operational identifier | Exact match and routing                 | Plain operational identifier; no bulk export | Identifier only when required for traceability |
| `username`         | `packages/database/prisma/base.prisma:20`    | Personal                        | Existing case-insensitive search        | Plain profile value                          | Omit value from generic audit snapshots        |
| `gender`           | `packages/database/prisma/base.prisma:29`    | Personal                        | None                                    | Plain profile value in this spec             | Field name and change kind only                |
| `governorate`      | `packages/database/prisma/base.prisma:30`    | Personal                        | None                                    | Plain profile value in this spec             | Field name and change kind only                |
| `countryCode`      | `packages/database/prisma/base.prisma:31`    | Personal                        | None                                    | Plain profile value in this spec             | Field name and change kind only                |
| `language`, `role` | `packages/database/prisma/base.prisma:22-23` | Operational                     | Exact operational filters               | Plain operational value                      | Allowlisted before/after value when required   |

## Normalization Decisions Requiring Enforcement

| Field          | Version 1 rule                                                                                  | Evidence and constraint                                                                                                                                                                                                                        |
| -------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `email`        | Trim surrounding whitespace and lowercase                                                       | Current repository performs case-insensitive substring search at `modules/user-management/repositories/user.repository.ts:34`. Substring search over protected email is out of scope and must be removed or replaced by an exact token lookup. |
| `nationalId`   | Validate and canonicalize through `@tempot/national-id-parser`; no ad hoc transformation        | `modules/user-management/services/user.service.ts:95` already uses the parser for Egyptian identities.                                                                                                                                         |
| `mobileNumber` | No lookup token is enabled in this protection wave; approve an E.164 contract before adding one | No phone normalization implementation exists in `packages/regional-engine`; the inventory script uses punctuation removal only as a conflict diagnostic, not as the production rule.                                                           |
| `birthDate`    | ISO calendar date after existing date validation                                                | No lookup token is permitted.                                                                                                                                                                                                                  |

## Persistence and Lookup Findings

| Finding                                                           | Evidence                                                                             | Required correction                                                                                                    |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Four protected fields are plaintext columns                       | `packages/database/prisma/base.prisma:21,26-28`                                      | Expand schema with protected payloads and lookup tokens before any retirement migration                                |
| Plaintext indexes exist for email, national ID, and mobile number | `packages/database/prisma/base.prisma:44,46-47`                                      | Replace approved exact lookups with token indexes; remove plaintext indexes only at the approved retirement checkpoint |
| Email substring search reads plaintext                            | `modules/user-management/repositories/user.repository.ts:31-35`                      | Preserve username substring search and introduce a separate exact email lookup                                         |
| Repository updates pass protected values directly to Prisma       | `modules/user-management/repositories/user.repository.ts:54-82`                      | Protect and tokenize within the repository persistence boundary                                                        |
| National ID updates derive additional profile data                | `modules/user-management/services/user.service.ts:85-117`                            | Recover the national ID only for the authorized parser flow and never log the recovered value                          |
| A legacy migration defines `user_management_profile` separately   | `modules/user-management/database/migrations/20260426000000_init_user_management.ts` | Inventory both table names and reconcile ownership before backfill                                                     |

## Audit and Observability Findings

| Channel          | Evidence                                                        | Current risk                                                                                            | Required policy                                                                             |
| ---------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Database audit   | `packages/database/src/base/base.repository.ts:137,161-162,186` | Whole created, updated, and deleted entities are copied into `before` and `after` JSON                  | Replace with an entity-specific safe-field allowlist and protected-field change markers     |
| Audit storage    | `packages/database/prisma/base.prisma:58-59`                    | Historical JSON can retain protected plaintext indefinitely                                             | Scan and irreversibly sanitize while retaining action, actor, target, status, and timestamp |
| Pino redaction   | `packages/logger/src/logger.config.ts:1`                        | Redaction omits email, national ID, mobile, birth date, aliases, and nested wildcard paths              | Centralize protected aliases and recursive serializers; add canary tests                    |
| Error serializer | `packages/logger/src/technical/error.serializer.ts:70-71`       | Recursive logic only protects the narrow current key list and leaves raw error messages/stacks possible | Redact protected aliases and sanitize error strings before emission                         |
| Sentry           | `packages/sentry/src/sentry.reporter.ts:67`                     | `AppError.details` is sent without redaction and no `beforeSend` policy exists                          | Apply the shared redaction policy before context assignment and at `beforeSend`             |

## Authorized Consumers

The following existing flows require controlled logical recovery:

- The user's profile presentation in
  `modules/user-management/commands/profile.command.ts`.
- Profile completeness checks in
  `modules/user-management/menus/profile-menu.factory.ts`.
- National ID parsing in
  `modules/user-management/services/user.service.ts`.
- Authorized user-management updates and exact identity lookups through
  `UserRepository`.

No handler, logger, audit writer, Sentry reporter, diagnostic command, or bulk
export path is authorized to receive key material.

## Backup Boundary

`docs/operations/DISASTER-RECOVERY.md:212` states that backups are encrypted
before upload with AES-256. The migration gate requires a restore rehearsal that
proves protected payloads, key-version metadata, and lookup tokens restore
correctly while key material remains outside the backup.

The repository contains no tracked `.env`, private-key, certificate, database
dump, or SQL backup artifact as of 2026-06-08.

## Read-Only Inventory Command

Run against an operator-selected database:

```powershell
$env:DATABASE_URL = '<operator-supplied-connection>'
corepack pnpm security:inventory
```

The command starts a read-only transaction and emits counts only:

- supported table presence,
- populated protected-field counts,
- duplicate canonical groups,
- normalization conflicts,
- audit records containing protected field names.

The command never prints field values. Its mobile canonicalization is a
diagnostic candidate only and cannot be reused as the production normalization
rule without approval.

### Local Development Evidence

The command was executed on 2026-06-08 against the local Docker development
database:

- `UserProfile` present; `user_management_profile` absent.
- 1 user row with all four first-wave fields populated.
- 0 duplicate groups and 0 diagnostic normalization conflicts.
- 280 audit rows and 0 records matching protected field-name aliases.

This evidence validates the script and the current local fixture only. It does
not approve or characterize any staging or production dataset; every target
deployment must run its own inventory.

## Approval Record

| Item                                        | Status   | Approver        | Date       |
| ------------------------------------------- | -------- | --------------- | ---------- |
| Classification and first-wave scope         | Approved | Project Manager | 2026-06-08 |
| Exact lookup fields and normalization rules | Approved | Project Manager | 2026-06-08 |
| Audit allowlist policy                      | Approved | Project Manager | 2026-06-08 |
| Backup and restore boundary                 | Approved | Project Manager | 2026-06-08 |
