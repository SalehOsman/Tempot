---
"@tempot/database": patch
---

Fix BaseRepository findMany argument handling so repository searches can pass Prisma where, pagination, and ordering arguments without nesting them inside the where clause.
