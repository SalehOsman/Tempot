# 🚨 Incident Record: INC-20261023-01-DATABASE-MIGRATION-DRIFT

* **Incident ID:** INC-20261023-01
* **Date:** 2026-10-23
* **Severity:** HIGH
* **Status:** RESOLVING
* **Impacted Components:** `packages/db-kernel`, `modules/kernel/system-settings`, PostgreSQL Container

---

## 1. Executive Summary

During full-system operational audit, inspecting the local PostgreSQL container via `docker exec tembot-postgres psql -U postgres -d tembot -c "\dt"` revealed `Did not find any relations.` All Drizzle ORM table definitions existed in source code, but no database migrations had been pushed or applied to the container. The bot and settings engine were silently operating on the `SettingsService` in-memory fallback store (`inMemoryStore`).

---

## 2. Forensic Timeline

* **06:28 UTC:** Developer verified PostgreSQL container was listening on port 5433.
* **06:29 UTC:** PostgreSQL queried for `system_settings` table. Query returned: `ERROR: relation "system_settings" does not exist`.
* **06:30 UTC:** Checked root `package.json` for migration scripts. `pnpm db:generate` executed 0 tasks because `@tembot/db-kernel` lacked `drizzle-kit` configuration.
* **06:31 UTC:** Verified `SettingsService` was functioning solely because of its in-memory fallback dictionary.

---

## 3. Root Cause Analysis (5 Whys)

1. **Why was PostgreSQL empty?** No migration or schema push command had been run against the database container.
2. **Why was no migration run?** `drizzle-kit` was not installed as a package dependency, and no `drizzle.config.ts` was present.
3. **Why did the bot continue running without errors?** `SettingsService` features a sovereign in-memory fallback that absorbs missing database connections to prevent application startup crashes.
4. **What was the hidden risk?** Any settings changes (locale, maintenance modes) would be lost whenever the Node.js process restarted.

---

## 4. Remediation & Sentinel Gate

1. Configure `drizzle-kit` in `packages/db-kernel/drizzle.config.ts`.
2. Consolidate all module schemas into a single aggregator entrypoint (`packages/db-kernel/src/schema.ts`).
3. Add `pnpm db:push` command to project root scripts.
4. Add a unit test (`packages/db-kernel/test/schema-drift.test.ts`) that asserts schema exports are valid and non-empty.
