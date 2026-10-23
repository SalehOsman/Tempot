# Telegram Bot Client Specification (`apps/bot`)

## 1. Executive Summary & Stack
The **Tembot-v2 Telegram Bot** powers conversational ingress across customer and operator interactions:
- **Bot Engine:** grammY (`grammy@1.46.0`)
- **Conversation State Engine:** `@grammyjs/conversations@2.1.1`
- **Flood Protection & Throttling:** `@grammyjs/transformer-throttler@1.2.1`
- **Component & Template Library:** `@tembot/core-components`

---

## 2. Interaction Architecture

```mermaid
flowchart TD
    User["Telegram Client (Mobile / Desktop)"] -->|"Update: Message / Callback"| GrammY["grammY Bot Engine"]
    
    subgraph Pipeline ["Middleware Pipeline"]
        SessionMiddleware["Session Middleware\n(Redis Store)"]
        ConversationMiddleware["@grammyjs/conversations\n(Wizard State Engine)"]
        ThrottlerMiddleware["Transformer Throttler\n(Flood-Wait Defense)"]
        AuthMiddleware["Capability & Auth Middleware\n(Actor Resolution & Access Control)"]
    end

    GrammY --> ThrottlerMiddleware
    ThrottlerMiddleware --> SessionMiddleware
    SessionMiddleware --> ConversationMiddleware
    ConversationMiddleware --> AuthMiddleware
    
    AuthMiddleware -->|"Command / Callback"| SliceAdapters["Application Slices / Ports"]
    SliceAdapters -->|"Typed Result<T, E>"| OutputDispatcher["Rich Message Dispatcher"]
    OutputDispatcher -->|"Bot API Call"| User
```

---

## 3. Standard Root Commands

- `/start`: Initializes user profile and renders the RTL interactive welcome card.
- `/menu`: Displays the main service navigation menu.
- `/app`: Direct launcher for the Telegram Mini App (TMA).
- `/settings`: Tri-surface configuration (language preference, notifications).
- `/help`: Contextual support manual and contact details.
- `/cancel`: Gracefully aborts any active multi-step conversation wizard and clears session state.

---

## 4. Execution Modes

1. **Local Development (Polling Mode):**
   * Uses `@grammyjs/runner` with `sequentialize` middleware.
   * Runs locally without requiring public domain or SSL certificates.
2. **Production Deployment (Webhook Mode):**
   * Hosted on Hono HTTP gateway (`POST /api/v1/telegram/webhook`).
   * Validates `X-Telegram-Bot-Api-Secret-Token` on every inbound update.
