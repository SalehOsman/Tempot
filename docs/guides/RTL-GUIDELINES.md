# RTL Guidelines (Legacy)

> ⚠️ **NOTICE:** This document is now considered **legacy**. All UX and UI standards, including RTL implementation details, have been consolidated into the unified [**UX Style Guide**](./UX-STYLE-GUIDE.md). Please refer to the new guide for all future development.

---

# Original RTL Guidelines — Arabic Right-to-Left Implementation

> Reference: Spec v11, Section 13.2 — Constitution Rule XLII

---

## Core Principle

Arabic is the **primary language** of Tempot. Every interface — bot messages, inline keyboards, Dashboard, Mini App, PDF reports, and Excel exports — must render correctly in RTL.

---

## Bot Messages

### Text Direction

Telegram renders Arabic text in RTL automatically when the text contains Arabic characters. No special markup is needed for pure Arabic messages.

For mixed Arabic/English content, wrap directional segments:

```typescript
// In locales/ar.json — use Unicode directional markers when needed
{
  "invoice.summary": "الفاتورة رقم {{id}} — المبلغ: {{amount}}"
}
```

### Number Formatting

Always use `RegionalEngine.formatNumber()` and `RegionalEngine.formatCurrency()` — never format numbers manually.

```typescript
// ✅ Correct
const amount = RegionalEngine.formatCurrency(1500, ctx); // ١٬٥٠٠٫٠٠ ج.م

// ❌ Wrong
const amount = `${invoice.amount} EGP`;
```

### List Messages

Use Arabic-compatible list formatting:

```typescript
// locales/ar.json
{
  "users.list.item": "{{emoji}} {{name}} — {{role}}"
}

// Result:
// 1️⃣ أحمد محمد — مدير
// 2️⃣ سارة علي — مستخدم
```

---

## Inline Keyboards

### Button Text Rules (Constitution Rule LXVI)

- Max **20 Arabic characters** per button (24 for English)
- Emoji at the **start** of button text
- Max **3 buttons per row**

```typescript
// ✅ Correct
keyboard.text('📋 عرض الفواتير', 'invoices.list');
keyboard.text('➕ فاتورة جديدة', 'invoices.create');

// ❌ Wrong — too long
keyboard.text('عرض قائمة الفواتير المدفوعة', 'invoices.list');

// ❌ Wrong — emoji at end
keyboard.text('عرض الفواتير 📋', 'invoices.list');
```

### Confirm/Cancel Pair

Always in the same row, Confirm on the right (RTL reading order):

```typescript
// In Arabic RTL, right-to-left means first button appears on right
keyboard
  .text('❌ إلغاء', 'cancel')
  .text('✅ تأكيد', 'confirm');
// Renders as: [تأكيد ✅] [إلغاء ❌] — confirm is on the right (primary action)
```

---

## Dashboard (Next.js)

### Root Layout

```tsx
// apps/dashboard/app/layout.tsx
import { cookies } from 'next/headers';

export default function RootLayout({ children }) {
  const lang = cookies().get('language')?.value ?? 'ar';
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={lang} dir={dir}>
      <body>{children}</body>
    </html>
  );
}
```

### Tailwind RTL Classes

Use Tailwind's logical properties instead of directional classes:

```tsx
// ✅ Correct — works in both RTL and LTR
<div className="ms-4 pe-8 text-start border-s-2">

// ❌ Wrong — breaks in RTL
<div className="ml-4 pr-8 text-left border-l-2">
```

| Directional class | Logical equivalent |
|------------------|-------------------|
| `ml-*`, `mr-*` | `ms-*`, `me-*` |
| `pl-*`, `pr-*` | `ps-*`, `pe-*` |
| `text-left`, `text-right` | `text-start`, `text-end` |
| `border-l-*`, `border-r-*` | `border-s-*`, `border-e-*` |
| `rounded-l-*`, `rounded-r-*` | `rounded-s-*`, `rounded-e-*` |

### Sidebar Direction

The Dashboard sidebar renders on the **right** in RTL mode:

```tsx
// apps/dashboard/components/layout/sidebar.tsx
<aside className="fixed end-0 top-0 h-full w-64 bg-white shadow-s">
  {/* Sidebar content */}
</aside>
```

### Table Direction

Data tables in Arabic show the first column on the right:

```tsx
<table dir="rtl" className="w-full">
  <thead>
    <tr>
      <th className="text-start">الاسم</th>
      <th className="text-start">الدور</th>
      <th className="text-end">الإجراءات</th>
    </tr>
  </thead>
</table>
```

---

## Mini App

### Base Setup

```tsx
// apps/mini-app/app/layout.tsx
export default function Layout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="font-arabic">{children}</body>
    </html>
  );
}
```

### Form Inputs

RTL inputs require explicit alignment:

```tsx
<input
  type="text"
  dir="auto"        // Auto-detects direction from first character
  className="w-full text-start"
  placeholder="أدخل اسمك"
/>
```

Use `dir="auto"` for text inputs that may contain either Arabic or English — the browser selects the correct direction based on the first character typed.

---

## PDF Generation (pdfmake)

### RTL Document Setup

```typescript
// packages/document-engine/src/pdf/pdf.builder.ts
const docDefinition = {
  pageDirection: 'RTL',
  defaultStyle: {
    font: 'Tajawal',          // Arabic-compatible font
    alignment: 'right',
    direction: 'rtl',
  },
  content: [
    {
      text: 'تقرير الفواتير',
      style: 'header',
      alignment: 'right',
    },
  ],
};
```

### Arabic Font Registration

```typescript
const fonts = {
  Tajawal: {
    normal: 'fonts/Tajawal-Regular.ttf',
    bold: 'fonts/Tajawal-Bold.ttf',
  },
};
```

### Mixed Content Tables

For tables with both Arabic and English content:

```typescript
{
  table: {
    body: [
      [
        { text: 'الاسم', alignment: 'right', direction: 'rtl' },
        { text: 'Amount', alignment: 'left', direction: 'ltr' },
      ],
    ],
  },
}
```

---

## Excel Generation (ExcelJS)

### Worksheet RTL Setting

```typescript
// packages/document-engine/src/excel/excel.builder.ts
const worksheet = workbook.addWorksheet('الفواتير', {
  views: [{ rightToLeft: true }],   // Enable RTL for entire sheet
});
```

### Column Headers

```typescript
worksheet.columns = [
  { header: 'رقم الفاتورة', key: 'id', width: 15 },
  { header: 'اسم العميل', key: 'customerName', width: 25 },
  { header: 'المبلغ', key: 'amount', width: 15 },
  { header: 'التاريخ', key: 'date', width: 15 },
];
```

### Number Formatting in Excel

```typescript
worksheet.getColumn('amount').numFmt = '#,##0.00 "ج.م"';
worksheet.getColumn('date').numFmt = 'dd/mm/yyyy';
```

---

## Testing RTL

### Visual Regression Testing

Use the `webapp-testing` skill with a screenshot comparison:

```bash
# In superpowers
/webapp-testing screenshot dashboard/invoices --lang=ar
/webapp-testing screenshot dashboard/invoices --lang=en
# Compare both screenshots for layout issues
```

### Common RTL Bugs to Check

- [ ] Sidebar appears on correct side (right for RTL)
- [ ] Table column order is reversed
- [ ] Form labels are right-aligned
- [ ] Confirm button is on the right in button pairs
- [ ] Pagination arrows are reversed (← for next, → for previous)
- [ ] PDF page numbers are on the correct side
- [ ] Numbers use Arabic-Indic numerals where appropriate
