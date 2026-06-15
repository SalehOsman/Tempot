---
"@tempot/database": patch
"@tempot/storage-engine": patch
---

Prevent normal repository and Prisma reads from overriding the active-record
soft-delete scope, and preserve the storage purge path through an explicit
privileged deleted-attachment query.
