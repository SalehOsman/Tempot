# Telegram Rich Messages & Mobile Viewport Standards

## 1. Overview & Official References
The **Tembot-v2 Platform** enforces strict compliance with official Telegram Bot API Rich Messages formatting, ensuring consistent, high-fidelity UI across all mobile and desktop Telegram clients.

Official references:
- [Telegram Bots: Features — Rich Messages](https://core.telegram.org/bots/features#rich-messages)
- [Bot API — Formatting Options](https://core.telegram.org/bots/api#rich-message-formatting-options)
- [Bot API — InputRichMessage](https://core.telegram.org/bots/api#inputrichmessage)

---

## 2. Shared Template Library (`@tembot/core-components`)

Every bot flow imports rich message templates from `@tembot/core-components`:
- `buildRichPage`: Structured RTL page with header, divider, and ordered content blocks.
- `buildRichTable`: Data table with centered header cells and direction-aligned numeric/text cells.
- `buildRichConfirmation`: Visual summary card featuring explicit **Confirm** and **Cancel** buttons.
- `assertRichMessage`: Enforces that exactly one payload field (`blocks`, `markdown`, or `html`) is provided.
- `validateRichMessageLimits`: Validates limits prior to invoking the Telegram API.

Arabic content must use `is_rtl: true` to enforce right-to-left alignment regardless of user system language.

---

## 3. Mobile Viewport Layout Budgets

To prevent horizontal clipping, button truncation, and keyboard overlap on mobile devices:

| Dimension | Hard Limit | Platform Rationale |
| :--- | :--- | :--- |
| **Callback Data Payload** | $\le \mathbf{36\text{ bytes}}$ | Well within the Telegram 64-byte limit; budgeted for state token + namespace |
| **Inline Button Label** | $\le \mathbf{16\text{ characters}}$ | Prevents horizontal ellipsis truncation on narrow mobile devices |
| **Keyboard Rows** | $\le \mathbf{7\text{ rows}}$ | Keeps inline keyboards visible above the virtual keyboard fold |
| **Buttons Per Row** | $\le \mathbf{3\text{ columns}}$ | Ensures touch target tap radius $\ge 44\text{px}$ on standard displays |
| **Max Message Length** | $\mathbf{32,768\text{ UTF-8 chars}}$ | Official Telegram Bot API maximum text capacity |
| **Block Nesting Depth** | $\le \mathbf{16\text{ levels}}$ | Prevents JSON parsing crashes on client Telegram apps |

---

## 4. Separation of Responsibilities

- **`packages/core-components`:** Pure templates, layout math, and limit validators.
- **`modules/*/slices/*/presenter.ts`:** Translates domain results into rich message structures.
- **`modules/*/slices/*/surfaces/bot.ts`:** Invokes action and dispatches rich messages via grammY.
