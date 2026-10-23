# 🚨 Incident Record: INC-20261023-02-PER-USER-LOCALE-ISOLATION

* **Incident ID:** INC-20261023-02
* **Date:** 2026-10-23
* **Severity:** MEDIUM
* **Status:** RESOLVING
* **Impacted Components:** `apps/bot`, `modules/kernel/system-settings`

---

## 1. Executive Summary

When a user in Telegram tapped `⚙️ Settings` -> `🌐 Change Locale` -> `🇸🇦 العربية`, the bot executed `SettingsService.updateSettings(tenantId, { defaultLocale: 'ar' })`. Because `defaultLocale` is a tenant-level property, this mutated the default language for **all future unauthenticated sessions and other users** on that tenant, rather than isolating the language choice to that specific Telegram user.

---

## 2. Root Cause Analysis

The bot's locale resolver `resolveLocale(tenantId, settingsService)` only inspected tenant configuration. The database lacked a dedicated `telegram_users` entity storing per-actor preferences (`telegramUserId`, `locale`, `updatedAt`).

---

## 3. Remediation & Sentinel Gate

1. Create `telegramUsers` table in `modules/kernel/system-settings/src/db/schema.ts` (or `user-locale-schema.ts`).
2. Add `getUserLocale(tenantId, telegramUserId)` and `setUserLocale(tenantId, telegramUserId, locale)` to `SettingsService`.
3. Update `apps/bot/src/bot.ts` so `resolveLocale` first checks the actor's personal preference, falling back to tenant default if unset.
4. Add unit and integration tests verifying that User A changing language to Arabic does not alter User B's English experience.
