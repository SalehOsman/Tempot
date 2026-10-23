# Kernel Module: System Settings (`system-settings`)

> **Architectural Paradigm:** Sovereign Tri-Surface Governance & Operational Configuration  
> **Package:** `@tembot/module-system-settings` (`modules/kernel/system-settings`)  
> **Interactive Surface:** Telegram Bot Persistent Keyboard + Rich Messages Flow  
> **Exposed Capabilities:** `settings:read`, `settings:write`  

---

## 1. Architectural Responsibility

The `system-settings` kernel module provides a centralized, single source of truth for platform configuration across all three user surfaces:
1. **Telegram Bot Surface (`bot`):** Bot name, welcome/help messages, bot-specific maintenance toggle.
2. **Telegram Mini App Surface (`tma`):** App title, HEX primary branding color, TMA-specific maintenance toggle.
3. **Web Admin Dashboard Surface (`dashboard`):** Platform name, logo, default language/direction (`ar` / `en`), session timeout.
4. **Global Master Toggle:** Platform-wide maintenance mode overriding all individual surface states.

---

## 2. Telegram Bot Interactive Experience

### 2.1. Persistent Reply Keyboard
The bot registers a persistent reply keyboard button allowing one-tap access to Settings:
```
[ 🚀 فتح التطبيق المصغر ]   [ ⚙️ الإعدادات ]
```

### 2.2. Rich Inline Flow
When `⚙️ الإعدادات` is tapped, the bot renders a standardized Rich Message page via `@tembot/core-components` (`buildRichPage`):
- HTML formatting with dividers.
- Mobile viewport budget limits strictly validated:
  - Button text: $\le 16$ characters.
  - Callback data: $\le 36$ bytes.
- Interactive multi-page flows:
  - Language selection (`cfg:loc:ar`, `cfg:loc:en`)
  - Maintenance mode toggle (`cfg:mnt:toggle` -> `buildRichConfirmation`)
  - Branding inspection (`cfg:brand`)

---

## 3. Schema & Data Invariants

- **Table:** `system_settings`
- **Invariants Enforced:**
  - Taboo 2: Zero Hard Deletes (`deleted_at` timestamptz).
  - Taboo 4: Deterministic timestamps (`created_at`, `updated_at` timestamptz).
  - Taboo 7: Multi-tenancy isolation (`tenant_id` uuid).
  - Immutable Audit: Every mutation is logged via `modules/kernel/audit-log` with cryptographic hash chaining.
