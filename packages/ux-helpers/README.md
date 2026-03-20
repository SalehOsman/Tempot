# @tempot/ux-helpers

> Standardised Telegram UX components — messages, keyboards, pagination, confirmations, and feedback.

## Purpose

Enforces the UX Standards defined in the Project Constitution (Rules LXIV–LXIX):

- `messages.ts` — four status message types: ⏳ Loading, ✅ Success, ❌ Error, ⚠️ Warning
- `keyboards.ts` — inline keyboard builder with Constitution button standards
- `pagination.ts` — list pagination for simple lists (without search)
- `confirm.ts` — confirmation dialogs with 5-minute auto-expiry
- `feedback.ts` — standardised success/error response helpers

## Phase

Phase 3 — Presentation Layer

## Dependencies

| Package | Purpose |
|---------|---------|
| `grammy` 1.x | Telegram context types |
| `@tempot/i18n-core` | All text from i18n keys |
| `@tempot/logger` | Error logging |

## API

```typescript
import { Messages, Keyboards, Pagination, Confirm } from '@tempot/ux-helpers';

// Status messages (edit existing message — Golden Rule)
await Messages.loading(ctx, 'common.processing');
await Messages.success(ctx, 'invoice.created');
await Messages.error(ctx, 'invoice.create_failed');
await Messages.warning(ctx, 'invoice.irreversible_action');

// Keyboard builder
const keyboard = Keyboards.builder()
  .button('📋 عرض الفواتير', 'invoices.list')
  .button('➕ فاتورة جديدة', 'invoices.create')
  .row()
  .button('🔙 رجوع', 'back')
  .build();

// Confirmation with auto-expiry (5 minutes)
await Confirm.ask(ctx, {
  messageKey: 'invoice.confirm_delete',
  confirmKey: 'invoice.delete_confirm_btn',
  cancelKey: 'common.cancel',
  onConfirm: async () => { await deleteInvoice(id); },
  onCancel: async () => { await Messages.info(ctx, 'common.cancelled'); },
});

// Simple pagination (for lists without search)
await Pagination.render(ctx, {
  items: invoices,
  page: currentPage,
  total: totalCount,
  pageSize: 10,
  renderItem: (invoice) => `${invoice.id} — ${invoice.amount}`,
});
```

## Button Standards (Constitution Rule LXVI)

| Rule | Value |
|------|-------|
| Max Arabic chars per button | 20 |
| Max English chars per button | 24 |
| Max buttons per row | 3 |
| Emoji position | Start of text |
| Confirm + Cancel | Always same row |

## Status

⏳ **Not yet implemented** — Phase 3
