# ⚙️ Admin Operations Manual

> Operator and Administrator handbook for system configuration, surface maintenance, and operational hygiene.

---

## 1. System Settings Architecture

The `@tembot/module-system-settings` kernel module manages tenant-isolated configuration across all channels:

### Core Configuration Properties:

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `platformName` | `string` | `"Tembot Platform"` | Displayed in headers across Bot, TMA, and Dashboard. |
| `defaultLocale` | `'en' \| 'ar'` | `'en'` | Default fallback language for new sessions and unauthenticated visitors. |
| `botMaintenanceMode` | `boolean` | `false` | When true, disables conversational flows for end users. |
| `tmaMaintenanceMode` | `boolean` | `false` | When true, displays maintenance overlay inside Telegram Mini App. |
| `isGlobalMaintenance` | `boolean` | `false` | Emergency kill switch suspending all omnichannel traffic. |
| `tmaPrimaryColor` | `hex string` | `"#2563eb"` | Accent theme color applied to UI controls in TMA. |

---

## 2. Distributed Cache Invalidation

Settings are cached in-memory with a 60-second TTL to ensure sub-millisecond bot response times:
* When an operator updates any setting via the Bot or Dashboard, the `SettingsService` immediately purges its local cache.
* If Redis is enabled, it broadcasts an invalidation signal over the pub/sub channel `system:settings:invalidated` to flush memory across all clustered runner instances.

---

## 3. Cryptographic Audit Log Integration

Every administrative mutation is recorded immutably via `@tembot/module-audit-log`:
* **Actor Identification:** Tracks who made the change (`actorId: "tg:12345678"` or `"admin:saleh"`).
* **Forensic State Delta:** Stores both before and after configuration snapshots in the `audit_logs` table.
* **Cryptographic Tamper-Proofing:** Each audit entry includes an incremental SHA-256 hash chained from the previous record. Any manual alteration in the database invalidates the hash chain immediately.

---

## 4. Emergency Procedures & Runbook

### Scenario A: Bot is Spamming or Compromised
1. Send `/settings` to the bot.
2. Select `🛠️ Maintenance Mode` -> `Toggle Bot Maintenance` -> `✅ Confirm`.
3. The bot enters maintenance mode immediately. All user commands receive an operational pause message while operators retain administrative access.

### Scenario B: Database Outage / Failover
The `SettingsService` features a sovereign in-memory fallback mechanism:
* If PostgreSQL is unreachable upon boot, the service automatically falls back to safe memory defaults (`defaultLocale: 'en'`, maintenance: false).
* The bot and TMA continue serving traffic without throwing fatal uncaught exceptions.
