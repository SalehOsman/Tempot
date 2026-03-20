# Dashboard and Mini App Architecture

> Reference: Spec v11, Section 12

---

## Overview

Tempot provides two web-based interfaces built with Next.js:

- **Dashboard** — Admin control panel with Plugin System for module pages
- **Mini App** — Telegram Mini App for end users

Both share a common component library and authentication flow via Hono.

---

## Dashboard Architecture

### Plugin System

Each module can register its own Dashboard pages via a `dashboard.plugin.ts` file. The Dashboard auto-discovers plugins at startup and adds them to the sidebar.

```typescript
// modules/invoices/dashboard.plugin.ts
export const invoicesPlugin: DashboardPlugin = {
  moduleId: 'invoices',
  label: 'Invoices',          // from i18n key
  icon: 'receipt',
  requiredRole: 'ADMIN',
  routes: [
    { path: '/invoices', component: InvoiceListPage },
    { path: '/invoices/:id', component: InvoiceDetailPage },
  ],
};
```

### Authentication Flow

```
Dashboard Login
  ↓
Hono API: POST /auth/dashboard
  ↓
CASL ability check (ADMIN or SUPER_ADMIN required)
  ↓
JWT session token issued
  ↓
Dashboard client stores token in httpOnly cookie
  ↓
All API requests include cookie
  ↓
Hono middleware validates token on every request
```

### Layout Structure

```
apps/dashboard/
├── app/
│   ├── layout.tsx          # Root layout — auth check + plugin sidebar
│   ├── (auth)/
│   │   └── login/
│   └── (protected)/
│       ├── dashboard/      # Home — metrics overview
│       ├── users/          # User management
│       ├── settings/       # System settings
│       ├── logs/           # Audit log viewer
│       └── [module]/       # Auto-generated plugin routes
├── components/
│   ├── layout/             # Sidebar, header, breadcrumb
│   ├── ui/                 # Shared UI components
│   └── charts/             # Recharts-based metric visualisations
├── lib/
│   ├── api.ts              # Typed Hono client
│   ├── auth.ts             # Session management
│   └── plugins.ts          # Plugin registry + auto-discovery
└── middleware.ts            # Next.js middleware — auth guard
```

### CASL on the Frontend

Dashboard uses CASL on the client side to conditionally render UI elements:

```typescript
const ability = useAbility(); // loaded from session

// Hide delete button if user cannot delete
{can(ability, 'delete', 'Invoice') && <DeleteButton />}
```

The server always re-validates permissions — client-side CASL is for UX only, not security.

---

## Mini App Architecture

### Telegram Web App Initialisation

```typescript
// apps/mini-app/app/layout.tsx
import WebApp from '@twa-dev/sdk';

useEffect(() => {
  WebApp.ready();
  WebApp.expand();
}, []);
```

### Authentication Handoff

```
User opens Mini App from Telegram
  ↓
Telegram injects initData into window.Telegram.WebApp.initData
  ↓
Mini App sends initData to Hono: POST /auth/mini-app
  ↓
Hono validates HMAC signature using BOT_TOKEN
  ↓
Session token issued (same flow as Dashboard)
  ↓
Mini App operates with full user context
```

### RTL-First Design

All Mini App layouts default to RTL for Arabic users:

```tsx
// apps/mini-app/app/layout.tsx
<html lang="ar" dir="rtl">
```

English users receive `dir="ltr"` via the i18n language detection middleware.

### Folder Structure

```
apps/mini-app/
├── app/
│   ├── layout.tsx          # RTL-aware root layout
│   ├── page.tsx            # Entry — dispatches to module mini-apps
│   └── [module]/           # Module-specific mini-app pages
├── components/
│   ├── telegram/           # Telegram-specific components (MainButton, BackButton)
│   └── ui/                 # Shared RTL-compatible components
└── lib/
    ├── telegram.ts         # WebApp SDK wrapper
    └── api.ts              # Typed Hono client
```

---

## Shared Component Library

Both Dashboard and Mini App share a component library at `packages/ux-helpers/`:

| Component | Location | Purpose |
|-----------|----------|---------|
| StatusMessage | `messages.ts` | ⏳ ✅ ❌ ⚠️ standard messages |
| KeyboardBuilder | `keyboards.ts` | Inline keyboard construction |
| Pagination | `pagination.ts` | List navigation |
| ConfirmDialog | `confirm.ts` | Confirmation with 5-min expiry |
| Feedback | `feedback.ts` | Success/error standardised responses |

---

## Deployment Notes

Both apps build as standard Next.js applications and can be deployed to:

- Vercel (recommended for Mini App — edge-optimised)
- Any Node.js server alongside the bot-server
- Cloudflare Pages (edge deployment)

The `NEXTAUTH_URL` and `NEXT_PUBLIC_BOT_API_URL` environment variables must be set for both apps.
