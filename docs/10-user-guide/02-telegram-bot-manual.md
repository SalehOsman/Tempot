# 🤖 Telegram Bot Operational Manual

> Detailed user and operator guide for the Tembot Telegram interface (`apps/bot`).

---

## 1. Starting the Bot

Users and operators interact with the bot by opening the chat with `@TembotDevBot` and sending the canonical start command:

```text
/start
```

### Initial Greeting & Onboarding Flow
Upon receiving `/start`, the bot executes the following sequence:
1. **Locale Resolution:** Queries `SettingsService` for the tenant's current language preference (`en` by default).
2. **Persistent Keyboard Docking:** Sends a persistent reply keyboard to the bottom of the client's screen containing:
   * `📱 Mini App (TMA)`: Launches the Mini App directly (when an HTTPS URL is active).
   * `⚙️ Settings`: Opens the rich settings and management dashboard.
3. **Rich Welcome Card:** Renders a structured HTML message with the bot's name, welcome text, and operator guide hint.
4. **Direct TMA Inline Button:** If `TMA_URL` is configured with an HTTPS URL, an inline button is attached for 1-tap launching.

---

## 2. Navigation Architecture

The bot uses a two-tier navigation structure:

### Tier 1: Persistent Bottom Reply Keyboard
Docked permanently below the chat input box:
* **English Layout:** `[ 📱 Mini App (TMA) ] [ ⚙️ Settings ]`
* **Arabic Layout:** `[ 📱 فتح التطبيق (TMA) ] [ ⚙️ الإعدادات ]`

This keyboard remains accessible regardless of scroll position.

### Tier 2: Rich Interactive Cards (Inline Keyboards)
Messages generated via `@tembot/core-components` utilize rich cards formatted with dividers (`──────────────────────────`) and structured inline buttons.

---

## 3. Settings Dashboard & Features

Tapping `⚙️ Settings` or typing `/settings` opens the Settings Dashboard:

```text
⚙️ System Settings
──────────────────────────
🏢 Platform: Tembot Platform
🌐 Default Locale: 🇬🇧 English
🤖 Bot Status: 🟢 Active
📱 Mini App Status: 🟢 Active
🛡️ Global Status: 🟢 Normal Operations
🎨 Brand Color: #2563eb
──────────────────────────
Use the buttons below to manage system configurations.
```

### Available Buttons & Actions:

| Button | Callback Data | Action / Result |
| :--- | :--- | :--- |
| `🌐 Change Locale` | `cfg:loc` | Opens the language selection screen. |
| `🛠️ Maintenance Mode` | `cfg:mnt` | Opens the maintenance control panel. |
| `❌ Close` | `cfg:close` | **Instantly deletes the card message** to keep the chat clean. |

---

## 4. Multi-Language (i18n) Switching

### How to Change the Language:
1. Tap `⚙️ Settings` from the bottom keyboard or send `/settings`.
2. Tap `🌐 Change Locale`.
3. Choose either:
   * `🇸🇦 العربية` (Switches interface to Arabic RTL).
   * `🇬🇧 English` (Switches interface to English LTR).
4. The system executes:
   * Updates `defaultLocale` in `SettingsService`.
   * Edits the existing card to the selected language.
   * Sends a confirmation notice: `✅ Language switched to English successfully.` (or Arabic equivalent).
   * **Re-docks the persistent bottom keyboard** in the selected language.

---

## 5. Maintenance Mode System

Platform operators can toggle maintenance mode across three granular scopes:

1. **Bot Maintenance (`cfg:mnt:bot`):** Suspends bot automated replies, displaying an operator maintenance notice.
2. **Mini App Maintenance (`cfg:mnt:tma`):** Displays a maintenance banner inside the Telegram Mini App.
3. **Global Maintenance (`cfg:mnt:all`):** Suspends all tenant operations across all channels.

### Two-Step Confirmation Safety Gate:
To prevent accidental outages, clicking any maintenance button requires explicit confirmation:
* Renders a Confirmation Card: `⚠️ Confirm Maintenance Mode Toggle`.
* Operator must tap `✅ Confirm` or `❌ Cancel`.
