# 📱 Telegram Mini App (TMA) Operational Manual

> User and developer guide for the embedded React 19 Telegram Mini App (`apps/tma`).

---

## 1. Overview & Architecture

The Telegram Mini App (TMA) is a web application that runs inside Telegram's embedded browser context (Webview). It bridges web technologies with native Telegram mobile features:
* Minimalist Ergonomics: Clean, focused interface displaying only the bot identity, settings gear, and essential user preferences.
* Dual Language Control: Instantaneous toggling between English (default, LTR) and Arabic (RTL) with dynamic DOM attributes.
* Appearance & Theme Switcher: Instant toggling between Dark Mode and Light Mode with calibrated CSS design tokens.
* Responsive Close Control: Native `Telegram.WebApp.close()` button for dismissals.
* Native Haptic Feedback: Vibrational touch confirmation via `Telegram.WebApp.HapticFeedback`.

---

## 2. Launching the Mini App

### Method A: From the Bottom Reply Keyboard
* Tap `📱 Mini App (TMA)` on the persistent keyboard docked at the bottom of the chat.
* If a secure HTTPS tunnel or production URL is configured, Telegram immediately slides up the Mini App webview.

### Method B: From the Start Greeting Button
* In the `/start` message, tap `🚀 Open Mini App in Telegram`.

### Method C: Local Browser Preview
If you are developing without an active HTTPS tunnel:
1. Tap the TMA button in chat.
2. The bot informs you that Telegram requires an HTTPS link and provides your local preview link:
   ```text
   http://localhost:5173
   ```
3. You can open this link in Chrome/Firefox/Edge to test UI components independently of Telegram.

---

## 3. Telegram Invariants & HTTPS Requirement

> [!IMPORTANT]
> **Telegram Invariant:** Telegram strictly rejects `http://` URLs for `web_app` buttons. Any Mini App loaded inside Telegram **must** be served over a valid **HTTPS** connection with valid SSL/TLS certificates.

### How Tembot Enforces This:
* When `TMA_URL` in `.env` starts with `https://`:
  The bot attaches native `web_app: { url: TMA_URL }` buttons to the keyboard.
* When `TMA_URL` is missing or is an `http://` link:
  The bot gracefully falls back to plain text buttons that guide the operator on running a tunnel or using the local browser preview.

---

## 4. Theme & Layout Synchronization

The Mini App integrates with `@telegram-apps/sdk-react` to automatically inherit Telegram's native appearance:

* **Theme Adaptation:** Automatically reads `Telegram.WebApp.themeParams`:
  * `bg_color` -> App background
  * `text_color` -> App foreground text
  * `button_color` -> Primary actions & CTA buttons
* **Viewport Expansion:** Automatically invokes `Telegram.WebApp.expand()` upon load to fill the entire mobile display.
* **Closing Confirmation:** Protects unfinished user flows from accidental dismissals via native Telegram dialogs.
