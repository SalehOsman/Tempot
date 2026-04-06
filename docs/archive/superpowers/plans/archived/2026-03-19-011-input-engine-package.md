# Input Engine Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the foundational input-engine package for dynamic multi-step conversations and form handling using grammY Conversations and Zod as per Architecture Spec v11 Blueprint.

**Architecture:** A high-level `FormRunner` that interprets a `Zod`-based `FormSchema`. It leverages `grammY Conversations` to manage the interaction state machine, uses `i18n-core` for all prompts, and implements `Partial Save` to Redis after each step. It explicitly uses `@tempot/session-manager` to access user context.

**Tech Stack:** TypeScript, grammY, @grammyjs/conversations, Zod, @tempot/i18n-core, @tempot/session-manager, @tempot/shared (CacheService).

---

### Task 1: Form Schema Definition and Field Types (FR-002, FR-003)

...

### Task 2: Core Form Runner with grammY Conversations (FR-001)

**Files:**

- Create: `packages/input-engine/src/runner/form.runner.ts`
- Test: `packages/input-engine/tests/unit/form-runner.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { FormRunner } from '../src/runner/form.runner';

describe('FormRunner', () => {
  it('should iterate through fields and call conversation.wait()', async () => {
    // Requires a mock grammY conversation object
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/input-engine/tests/unit/form-runner.test.ts`
Expected: FAIL (FormRunner not defined)

- [ ] **Step 3: Write minimal implementation with sessionContext**

```typescript
import { Conversation } from '@grammyjs/conversations';
import { FormSchema } from '../types/form.types';
import { t } from '@tempot/i18n-core';
import { sessionContext } from '@tempot/session-manager';

export class FormRunner {
  async run(conversation: Conversation<any>, schema: FormSchema): Promise<any> {
    const result: any = {};
    const context = sessionContext.getStore(); // Retrieve user context

    for (const [key, field] of Object.entries(schema.fields)) {
      if (field.condition && !field.condition(result)) continue;

      await conversation.reply(t(field.label));

      const { message } = await conversation.wait();
      const value = message?.text;

      const validated = field.validation.safeParse(value);
      if (!validated.success) {
        await conversation.reply(t('common.errors.invalid_input'));
      } else {
        result[key] = validated.data;
      }
    }

    return result;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test packages/input-engine/tests/unit/form-runner.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/input-engine/src/runner/form.runner.ts
git commit -m "feat(input-engine): implement core FormRunner with sessionContext integration (FR-001)"
```

---

### Task 3: Partial Save and Recovery (FR-005, Rule XXXII)

...

```

```
