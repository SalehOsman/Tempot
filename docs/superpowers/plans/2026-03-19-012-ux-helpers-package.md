# UX Helpers Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the foundational ux-helpers package for standardized messages, buttons, and UI components as per Tempot v11 Blueprint.

**Architecture:** A collection of utility classes and factory functions that wrap `grammY` types to enforce design consistency. It includes a `MessageFactory` for status-based responses (Success, Error, etc.), a `KeyboardBuilder` that automates row/column layout based on label length, and specialized helpers for pagination, confirmations, and title formatting.

**Tech Stack:** TypeScript, grammY, @tempot/i18n-core, @tempot/session-manager.

---

### Task 1: Status Message Factory (FR-001, Rule LXV)

**Files:**
- Create: `packages/ux-helpers/src/messages/status.factory.ts`
- Test: `packages/ux-helpers/tests/unit/status-messages.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { StatusFactory } from '../src/messages/status.factory';

describe('StatusFactory', () => {
  it('should create a success message with the correct emoji', () => {
    const msg = StatusFactory.success('common.success.saved');
    expect(msg).toContain('✅');
    expect(msg).toContain('common.success.saved'); // assuming mock i18n
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/ux-helpers/tests/unit/status-messages.test.ts`
Expected: FAIL (StatusFactory not defined)

- [ ] **Step 3: Write minimal implementation**

```typescript
import { t } from '@tempot/i18n-core';

export class StatusFactory {
  static success(key: string, params?: any): string {
    return `✅ ${t(key, params)}`;
  }

  static error(key: string, params?: any): string {
    return `❌ ${t(key, params)}`;
  }

  static loading(key: string = 'common.status.loading'): string {
    return `⏳ ${t(key)}`;
  }

  static warning(key: string, params?: any): string {
    return `⚠️ ${t(key, params)}`;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test packages/ux-helpers/tests/unit/status-messages.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/ux-helpers/src/messages/status.factory.ts
git commit -m "feat(ux-helpers): implement StatusFactory for standardized messages (FR-001)"
```

---

### Task 2: Unified Keyboard Builder (FR-003, Rule LXVI)

**Files:**
- Create: `packages/ux-helpers/src/keyboards/keyboard.builder.ts`
- Test: `packages/ux-helpers/tests/unit/keyboard-builder.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { KeyboardBuilder } from '../src/keyboards/keyboard.builder';

describe('KeyboardBuilder', () => {
  it('should wrap buttons to new rows if label is too long', () => {
    const builder = new KeyboardBuilder();
    builder.add('Very Long Label That Should Be Alone', 'data1');
    builder.add('Short', 'data2');
    builder.add('Short 2', 'data3');
    
    const markup = builder.build();
    expect(markup.inline_keyboard.length).toBe(2); // Row 1: Long, Row 2: Short + Short 2
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/ux-helpers/tests/unit/keyboard-builder.test.ts`
Expected: FAIL (KeyboardBuilder not defined)

- [ ] **Step 3: Write minimal implementation**

```typescript
import { InlineKeyboard } from 'grammy';

export class KeyboardBuilder {
  private buttons: { text: string; data: string }[] = [];

  add(text: string, data: string): this {
    this.buttons.push({ text, data });
    return this;
  }

  build(): InlineKeyboard {
    const keyboard = new InlineKeyboard();
    let currentRow: { text: string; data: string }[] = [];

    for (const btn of this.buttons) {
      const isLong = btn.text.length > 15;
      
      if (isLong || currentRow.length >= 3) {
        if (currentRow.length > 0) {
          this.addButtonsToRow(keyboard, currentRow);
          keyboard.row();
          currentRow = [];
        }
        this.addButtonsToRow(keyboard, [btn]);
        keyboard.row();
      } else {
        currentRow.push(btn);
      }
    }

    if (currentRow.length > 0) {
      this.addButtonsToRow(keyboard, currentRow);
    }

    return keyboard;
  }

  private addButtonsToRow(keyboard: InlineKeyboard, buttons: any[]) {
    for (const btn of buttons) {
      keyboard.text(btn.text, btn.data);
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test packages/ux-helpers/tests/unit/keyboard-builder.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/ux-helpers/src/keyboards/keyboard.builder.ts
git commit -m "feat(ux-helpers): implement KeyboardBuilder with layout enforcement (FR-003)"
```

---

### Task 3: Confirmation Helper (FR-006)

**Files:**
- Create: `packages/ux-helpers/src/keyboards/confirmation.helper.ts`
- Test: `packages/ux-helpers/tests/unit/confirmation-helper.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { ConfirmationHelper } from '../src/keyboards/confirmation.helper';

describe('ConfirmationHelper', () => {
  it('should create side-by-side Confirm/Cancel buttons', () => {
    const markup = ConfirmationHelper.create('confirm_action', 'cancel_action');
    expect(markup.inline_keyboard[0].length).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/ux-helpers/tests/unit/confirmation-helper.test.ts`
Expected: FAIL (ConfirmationHelper not defined)

- [ ] **Step 3: Write minimal implementation**

```typescript
import { InlineKeyboard } from 'grammy';
import { t } from '@tempot/i18n-core';

export class ConfirmationHelper {
  static create(confirmData: string, cancelData: string): InlineKeyboard {
    return new InlineKeyboard()
      .text(`✅ ${t('common.buttons.confirm')}`, confirmData)
      .text(`❌ ${t('common.buttons.cancel')}`, cancelData);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test packages/ux-helpers/tests/unit/confirmation-helper.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/ux-helpers/src/keyboards/confirmation.helper.ts
git commit -m "feat(ux-helpers): implement ConfirmationHelper for side-by-side buttons (FR-006)"
```

---

### Task 4: Pagination Helper (FR-004)

**Files:**
- Create: `packages/ux-helpers/src/keyboards/pagination.helper.ts`
- Test: `packages/ux-helpers/tests/unit/pagination-helper.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { PaginationHelper } from '../src/keyboards/pagination.helper';

describe('PaginationHelper', () => {
  it('should generate next/prev buttons based on total pages', () => {
    const markup = PaginationHelper.create(2, 5, 'list_page_');
    const buttons = markup.inline_keyboard[0];
    expect(buttons.length).toBe(3); // Prev, Current (noop), Next
  });
});
```

- [ ] **Step 2: Run minimal implementation**

```typescript
import { InlineKeyboard } from 'grammy';

export class PaginationHelper {
  static create(currentPage: number, totalPages: number, actionPrefix: string): InlineKeyboard {
    const keyboard = new InlineKeyboard();
    if (currentPage > 1) {
      keyboard.text('⬅️', `${actionPrefix}${currentPage - 1}`);
    }
    keyboard.text(`- ${currentPage} / ${totalPages} -`, 'noop');
    if (currentPage < totalPages) {
      keyboard.text('➡️', `${actionPrefix}${currentPage + 1}`);
    }
    return keyboard;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/ux-helpers/src/keyboards/pagination.helper.ts
git commit -m "feat(ux-helpers): implement PaginationHelper (FR-004)"
```

---

### Task 5: Title Formatting Helper (FR-005)

**Files:**
- Create: `packages/ux-helpers/src/messages/title.helper.ts`
- Test: `packages/ux-helpers/tests/unit/title-helper.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
import { TitleHelper } from '../src/messages/title.helper';

describe('TitleHelper', () => {
  it('should format a string as a bold HTML title with an emoji', () => {
    const title = TitleHelper.format('Main Menu', '🏠');
    expect(title).toBe('<b>🏠 Main Menu</b>\n\n');
  });
});
```

- [ ] **Step 2: Run minimal implementation**

```typescript
export class TitleHelper {
  static format(title: string, emoji?: string): string {
    const prefix = emoji ? `${emoji} ` : '';
    return `<b>${prefix}${title}</b>\n\n`;
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/ux-helpers/src/messages/title.helper.ts
git commit -m "feat(ux-helpers): implement TitleHelper for standardized headers (FR-005)"
```
