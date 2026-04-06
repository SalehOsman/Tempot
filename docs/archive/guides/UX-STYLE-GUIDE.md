# UX Style Guide

This guide defines the mandatory UX and UI standards for the Tempot framework across all interfaces: Telegram Bot, Dashboard, Mini App, and generated documents (PDF/Excel).

---

## 1. The Golden Rule: Message Updates

**Constitution Rule LXIV / Spec 13.3**

The core interaction principle in Tempot is to **always edit the existing message** instead of sending a new one. This keeps the chat history clean and provides a "web-app-like" experience within Telegram.

### Interaction Flow:
1. **Trigger**: User presses an inline button.
2. **Indicator**: Immediately update the message with a ⏳ **Loading** state (if the action takes >1 second).
3. **Result**: Update the same message with the final result.
4. **Navigation**: Provide buttons for the next logical steps.

---

## 2. Standardized Status Messages

**Constitution Rule LXV / Spec 13.4**

Every automated response must follow one of these four status patterns:

| Type | Emoji | Pattern | Example |
| :--- | :---: | :--- | :--- |
| **Loading** | ⏳ | Symbol + Present Tense Verb | ⏳ Processing payment... |
| **Success** | ✅ | Symbol + Past Tense Action | ✅ Invoice paid successfully |
| **Error** | ❌ | Symbol + Problem + Solution | ❌ Connection failed. Please try again later. |
| **Warning** | ⚠️ | Symbol + Caution + Options | ⚠️ This action is irreversible. Are you sure? |

---

## 3. Button Standards

**Constitution Rule LXVI / Spec 13.1**

### Inline Keyboards (Telegram)
- **Character Limits**: Maximum **20 Arabic characters** or **24 English characters** per button.
- **Layout**: Maximum **3 buttons per row**. Long text buttons should occupy their own row.
- **Emoji Position**: Always place emojis at the **start** of the button text for instant scannability.
- **Action-Oriented Text**: Use descriptive action names (e.g., "🗑️ Delete Invoice") instead of generic terms like "Yes" or "Confirm".

### Button Pairs (Confirm/Cancel)
- **Same Row**: Confirm and Cancel buttons must **always** be in the same row.
- **RTL Ordering**: In Arabic (RTL), the **Confirm (Primary)** button must be on the **right**, and the **Cancel (Secondary)** button on the **left**.

---

## 4. RTL (Right-to-Left) Implementation

**Spec 13.2 / RTL Guidelines (Legacy)**

Arabic is the primary language of Tempot. RTL support is not optional.

### General Principles
- **Number Formatting**: Never format numbers manually. Use `RegionalEngine.formatNumber()` and `RegionalEngine.formatCurrency()`.
- **Directional Markers**: Use Unicode directional markers for mixed Arabic/English content to prevent layout "jitter".

### Dashboard & Mini App (Web)
- **Root Direction**: Set `dir="rtl"` and `lang="ar"` on the `<html>` tag.
- **Logical Properties**: Use Tailwind logical properties instead of directional ones:
  - Use `ms-*` / `me-*` (Margin Start/End) instead of `ml-*` / `mr-*`.
  - Use `ps-*` / `pe-*` (Padding Start/End) instead of `pl-*` / `pr-*`.
  - Use `text-start` / `text-end` instead of `text-left` / `text-right`.
  - Use `border-s-*` / `border-e-*` instead of `border-l-*` / `border-r-*`.
- **Inputs**: Use `dir="auto"` on text inputs to allow the browser to detect direction based on the first character entered.

---

## 5. List Display Standards

**Constitution Rule LXVIII / Spec 13.7**

- **Counters**: The list title must always include the total count of results (e.g., "📋 My Invoices (15)").
- **Visual Separation**: Use horizontal lines or clear spacing to separate the title, content, and navigation buttons.
- **Ordering**: Use emoji numbers (1️⃣ 2️⃣ ...) for list items.
- **Auto-Pagination**: Lists with **5 or more items** must implement automatic pagination.
- **Empty States**: If no items are found, show a helpful message and a button for the "Next Logical Step" (e.g., "➕ Create New").

---

## 6. Confirmation Behavior

**Constitution Rule LXVII / Spec 13.6**

- **Auto-Expiry**: All confirmation buttons must automatically expire and become inactive after **5 minutes**.
- **Irreversible Actions**: Actions that cannot be undone (like deletion) must show a clear ⚠️ **Warning** message.
- **Explicit Buttons**: The confirmation button must state the exact action (e.g., "🗑️ Delete Permanently").

---

## 7. Error Message UX

**Constitution Rule LXIX / Spec 13.5**

- **User Errors**: Clearly state the problem and provide a direct solution (e.g., "❌ Invalid date. Please use YYYY-MM-DD.").
- **System Errors**: Show a generic "Something went wrong" message and include a unique **Reference Code** (e.g., `ERR-20260321-ABCD`). This code must link to the internal Audit Log.
- **Permission Errors**: State the denial reason simply (e.g., "❌ You do not have permission to edit this record") without exposing technical details of the RBAC system.
- **Session Expired**: Show a clear notification with a "🔄 Restart Bot" button.

---

## 8. Dashboard & Mini App Specifics

- **Sidebar**: In RTL, the sidebar must appear on the **right** side of the screen.
- **Tables**: Column order must be mirrored in RTL (First column on the right).
- **Icons**: Mirror directional icons (like arrows) in RTL mode, unless they represent universal playback controls (Play/Pause).
