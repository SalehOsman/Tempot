# Bot Management Lifecycle Operations Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the inline-first lifecycle operating surface for `bot-management` by exposing state-derived actions, executing valid transitions through existing services, collecting required reasons through `@tempot/input-engine`, protecting archive with confirmation, and reconciling module documentation.

**Architecture:** Keep lifecycle policy and mutation authority in `LifecycleService`; callbacks only route, fetch current details, and render localized surfaces. Reason-required actions reuse the existing conversation-backed form pattern already introduced for bot registration, with one focused lifecycle reason flow shared by pause, maintenance, and archive.

**Tech Stack:** TypeScript 5.9.3 strict mode, grammY 1.41.x, `@grammyjs/conversations`, `@tempot/input-engine`, neverthrow, Vitest 4.1.0.

---

## File Map

- Create `modules/bot-management/menus/lifecycle-menu.factory.ts` for state-derived lifecycle action menus and archive confirmation menus.
- Create `modules/bot-management/flows/lifecycle-reason.flow.ts` for the shared reason form and post-form service delegation.
- Create `modules/bot-management/services/lifecycle-service.context.ts` only if runtime setup needs the same singleton access pattern already used by `BotService`.
- Modify `modules/bot-management/handlers/callback.handler.ts` to open lifecycle menus, execute direct transitions, start reason flows, and handle archive confirmation.
- Modify `modules/bot-management/index.ts` to initialize lifecycle service access and register the new conversation when required.
- Modify `modules/bot-management/locales/en.json` and `modules/bot-management/locales/ar.json` for lifecycle menu, prompt, confirmation, cancellation, and success/error copy.
- Modify `modules/bot-management/README.md` so module behavior reflects lifecycle operations, not registration-only behavior.
- Add focused tests under `modules/bot-management/tests/unit/` for lifecycle menus, callbacks, reason flow, and runtime registration.

### Task 1: Lifecycle Menu Projection

**Files:**
- Create: `modules/bot-management/menus/lifecycle-menu.factory.ts`
- Test: `modules/bot-management/tests/unit/lifecycle-menu.factory.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
it('shows only configured-state lifecycle actions', () => {
  const keyboard = createLifecycleMenu(t, configuredBot);
  expect(buttonData(keyboard)).toEqual([
    'botmgmt:lifecycle-transition:bot-1:ACTIVE',
    'botmgmt:lifecycle-archive-confirm:bot-1',
    'botmgmt:view:bot-1',
  ]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @tempot/bot-management test -- lifecycle-menu.factory.test.ts`

Expected: FAIL because `createLifecycleMenu` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```ts
export function createLifecycleMenu(
  t: Translate,
  bot: ManagedBot,
): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  const transitions = VALID_BOT_TRANSITIONS[bot.status];
  for (const transition of transitions) {
    appendLifecycleAction(keyboard, t, bot.id, transition);
  }
  return keyboard.row().text(t('bot-management.menu.back'), `botmgmt:view:${bot.id}`);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @tempot/bot-management test -- lifecycle-menu.factory.test.ts`

Expected: PASS.

### Task 2: Callback Lifecycle Entry and Direct Transitions

**Files:**
- Modify: `modules/bot-management/handlers/callback.handler.ts`
- Test: `modules/bot-management/tests/unit/lifecycle-callback.handler.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
it('renders lifecycle controls from the lifecycle callback', async () => {
  getDetailMock.mockResolvedValue(ok(configuredBot));
  await handleCallbackQuery(createCallbackContext('botmgmt:lifecycle:bot-1'));
  expect(editMessageTextMock).toHaveBeenCalledWith('lifecycle controls', {
    reply_markup: lifecycleKeyboard,
  });
});

it('executes a direct valid transition through LifecycleService', async () => {
  transitionMock.mockResolvedValue(ok(activeBot));
  await handleCallbackQuery(
    createCallbackContext('botmgmt:lifecycle-transition:bot-1:ACTIVE'),
  );
  expect(transitionMock).toHaveBeenCalledWith({
    botId: 'bot-1',
    toStatus: BotLifecycleStatus.ACTIVE,
    actorId: '123',
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @tempot/bot-management test -- lifecycle-callback.handler.test.ts`

Expected: FAIL because lifecycle callback branches and lifecycle service access are not wired yet.

- [ ] **Step 3: Write minimal implementation**

```ts
if (action === 'lifecycle' && value) {
  await showLifecycleControls(ctx, value);
  return;
}

if (action === 'lifecycle-transition' && value && trailingValue) {
  await executeDirectLifecycleTransition(ctx, value, trailingValue);
  return;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @tempot/bot-management test -- lifecycle-callback.handler.test.ts`

Expected: PASS.

### Task 3: Lifecycle Service Runtime Context

**Files:**
- Create if needed: `modules/bot-management/services/lifecycle-service.context.ts`
- Modify if needed: `modules/bot-management/index.ts`
- Test: `modules/bot-management/tests/unit/lifecycle-runtime-registration.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
it('registers lifecycle flow runtime support during module setup', async () => {
  const bot = createRuntimeBot();
  await setup(bot as never, createDeps());
  expect(bot.use).toHaveBeenCalledWith(expect.any(Function));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @tempot/bot-management test -- lifecycle-runtime-registration.test.ts`

Expected: FAIL if setup has no lifecycle service or conversation registration.

- [ ] **Step 3: Write minimal implementation**

```ts
initLifecycleService();
bot.use(
  createConversation<Context, Context>(
    runLifecycleReasonConversation,
    BOT_LIFECYCLE_REASON_FLOW_ID,
  ) as unknown as MiddlewareFn<Context>,
);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @tempot/bot-management test -- lifecycle-runtime-registration.test.ts`

Expected: PASS.

### Task 4: Shared Reason Flow for Governed Transitions

**Files:**
- Create: `modules/bot-management/flows/lifecycle-reason.flow.ts`
- Modify: `modules/bot-management/handlers/callback.handler.ts`
- Test: `modules/bot-management/tests/unit/lifecycle-reason.flow.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
it('collects a reason through input-engine and delegates to LifecycleService', async () => {
  runFormMock.mockResolvedValue(ok({ reason: 'Operational pause' }));
  transitionMock.mockResolvedValue(ok(pausedBot));
  await runLifecycleReasonConversation(conversation, ctx, {
    botId: 'bot-1',
    toStatus: BotLifecycleStatus.PAUSED,
  });
  expect(transitionMock).toHaveBeenCalledWith({
    botId: 'bot-1',
    toStatus: BotLifecycleStatus.PAUSED,
    actorId: '123',
    reason: 'Operational pause',
  });
});

it('does not mutate state when the reason form is cancelled', async () => {
  runFormMock.mockResolvedValue(err(new AppError('input-engine.form.cancelled')));
  await runLifecycleReasonConversation(conversation, ctx, intent);
  expect(transitionMock).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @tempot/bot-management test -- lifecycle-reason.flow.test.ts`

Expected: FAIL because the lifecycle reason flow does not exist.

- [ ] **Step 3: Write minimal implementation**

```ts
const formResult = await runForm<LifecycleReasonFormData>(...);
if (formResult.isErr()) {
  await ctx.reply(i18n.t('bot-management.lifecycle.reason_cancelled'));
  return;
}
await getLifecycleService().transition({
  botId: input.botId,
  toStatus: input.toStatus,
  actorId: telegramId,
  reason: formResult.value.reason.trim(),
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @tempot/bot-management test -- lifecycle-reason.flow.test.ts`

Expected: PASS.

### Task 5: Archive Confirmation

**Files:**
- Modify: `modules/bot-management/handlers/callback.handler.ts`
- Extend: `modules/bot-management/menus/lifecycle-menu.factory.ts`
- Test: `modules/bot-management/tests/unit/lifecycle-callback.handler.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
it('renders archive confirmation before starting the archive reason flow', async () => {
  await handleCallbackQuery(createCallbackContext('botmgmt:lifecycle-archive-confirm:bot-1'));
  expect(editMessageTextMock).toHaveBeenCalledWith('archive confirm', {
    reply_markup: archiveConfirmKeyboard,
  });
  expect(conversationEnterMock).not.toHaveBeenCalled();
});

it('starts the reason flow only after archive confirmation is approved', async () => {
  await handleCallbackQuery(createCallbackContext('botmgmt:lifecycle-archive-start:bot-1'));
  expect(conversationEnterMock).toHaveBeenCalled();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @tempot/bot-management test -- lifecycle-callback.handler.test.ts`

Expected: FAIL because archive confirmation routes are not implemented.

- [ ] **Step 3: Write minimal implementation**

```ts
if (action === 'lifecycle-archive-confirm' && value) {
  await showArchiveConfirmation(ctx, value);
  return;
}

if (action === 'lifecycle-archive-start' && value) {
  await enterLifecycleReasonFlow(ctx, value, BotLifecycleStatus.ARCHIVED);
  return;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @tempot/bot-management test -- lifecycle-callback.handler.test.ts`

Expected: PASS.

### Task 6: Locales and Documentation Reconciliation

**Files:**
- Modify: `modules/bot-management/locales/en.json`
- Modify: `modules/bot-management/locales/ar.json`
- Modify: `modules/bot-management/README.md`

- [ ] **Step 1: Update locale keys required by the new surfaces**

Add keys for lifecycle title, archive confirmation, reason prompt, cancellation, and generic transition success/error responses.

- [ ] **Step 2: Update README to match shipped behavior**

Document inline lifecycle controls, direct state changes, reason-required flow reuse, archive confirmation, and explicit scope boundaries for the current lifecycle slice.

- [ ] **Step 3: Run focused validation**

Run:

```powershell
pnpm --filter @tempot/bot-management test
pnpm spec:validate
git diff --check
```

Expected: all commands exit `0`.

### Task 7: Wider Verification Before Completion

- [ ] **Step 1: Run required quality gates**

```powershell
pnpm lint
pnpm build
pnpm cms:check
pnpm boundary:audit
pnpm module:checklist
```

- [ ] **Step 2: Review failures at the source**

If any gate fails, reproduce the exact failing unit locally, patch the source of the defect, and rerun the smallest failing command before broader gates.

- [ ] **Step 3: Capture completion evidence**

Record the final commands and their pass/fail status in the final handoff summary before any merge or push decision.
