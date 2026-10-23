# 4. Adopt Frontend UI, Data Tables, and Shared Contracts Package

Date: 2026-10-23

## Status
Accepted

## Context
Tembot-v2 requires two browser-based client surfaces:
1. **Web Admin Dashboard (`apps/dashboard`):** High-density desktop operations portal.
2. **Telegram Mini App (`apps/tma`):** Mobile embedded webview inside Telegram.

Both surfaces require:
- Shared UI primitives (shadcn/ui + Tailwind CSS v4 + Lucide React).
- Type-safe communication with Hono RPC without bundling Node.js backend drivers into browser builds.
- Data table virtualization and server-side state synchronization.

## Decision
1. **Visual Reference & UI System:**
   - Adopt the visual structure of [Studio Admin Dashboard](https://github.com/arhamkhnz/next-shadcn-admin-dashboard) as a visual reference, adapted to Vite + React 19.
   - Extract shared UI primitives into `@tembot/ui`.
2. **Shared Contracts Package (`@tembot/contracts`):**
   - Create `@tembot/contracts` as a browser-safe package containing Zod DTO schemas and Hono RPC endpoint definitions. Both `apps/dashboard` and `apps/tma` import API types from this package.
3. **Queue Observability & API Docs:**
   - Integrate `@bull-board/hono` and `@scalar/hono-api-reference` into the server and dashboard.
4. **Data Management:**
   - Adopt `@tanstack/react-table` for high-performance server-paginated tables and `@tanstack/react-query` for remote state caching.

## Consequences
### Positive
- Browser builds remain 100% free of backend Node.js code.
- Unified UI components and RTL styling across TMA and Admin Dashboard.
- Complete type safety from database query to React table cell.
