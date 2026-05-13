# Bot Management UX Helpers Reference Standard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert `bot-management` into the first reference module for `@tempot/ux-helpers`, then document that package-first Telegram UX model for future modules.

**Architecture:** Keep `bot-management` domain behavior unchanged while standardizing its presentation layer. Menu factories and confirmation surfaces should compose `@tempot/ux-helpers`; locale files own icon-prefixed labels; existing `@tempot/input-engine` registration flows remain intact except where module-owned prompt rendering can be aligned with the same UX policy.

**Tech Stack:** TypeScript strict mode, grammY 1.41.x, `@tempot/ux-helpers`, `@tempot/input-engine`, Vitest 4.1.0, Tempot module i18n conventions.

---

## File Map

- Modify `modules/bot-management/menus/bot-menu.factory.ts`
  - Standardize bot list and detail menu construction.
- Modify `modules/bot-management/menus/lifecycle-menu.factory.ts`
  - Standardize lifecycle and archive confirmation menus.
- Modify `modules/bot-management/flows/bot-registration.flow.ts`
  - Review the raw `inline_keyboard` rendering boundary and replace or document
    only the module-owned presentation layer that can be aligned safely.
- Modify `modules/bot-management/locales/ar.json`
  - Add icon-prefixed labels for operational actions.
- Modify `modules/bot-management/locales/en.json`
  - Keep locale parity with Arabic labels.
- Add or modify unit tests under `modules/bot-management/tests/unit/menus/`
  - Cover layout, button ordering, and callback targets.
- Add or modify registration flow tests when presentation behavior changes.
- Already updated:
  - `docs/developer/module-capability-reuse-standard.md`
  - `docs/developer/module-development-catalog.md`
  - `docs/superpowers/specs/2026-05-13-bot-management-ux-helpers-reference-standard-design.md`

### Task 1: Lock the Bot Management UX Acceptance Surface

**Files:**
- Test: `modules/bot-management/tests/unit/menus/bot-menu.factory.test.ts`
- Test: `modules/bot-management/tests/unit/menus/lifecycle-menu.factory.test.ts`

- [ ] **Step 1: Write failing bot menu tests**

Add tests that assert:

```ts
it('should render icon-prefixed primary bot list actions in a mobile-friendly order', () => {
  const keyboard = createBotListMenu({
    t,
    bots: [],
    page: 0,
    totalPages: 1,
  });

  expect(flattenKeyboard(keyboard)).toEqual([
    '➕ New bot',
    '🔄 Refresh',
  ]);
});
```

```ts
it('should keep bot detail navigation grouped by operational intent', () => {
  const keyboard = createBotDetailMenu(t, managedBotFixture);

  expect(extractRows(keyboard)).toEqual([
    ['🔁 Lifecycle', '⚙️ Settings'],
    ['📦 Modules'],
    ['↩️ Back'],
  ]);
});
```

- [ ] **Step 2: Run the focused bot menu tests and confirm they fail**

Run:

```powershell
pnpm --filter bot-management exec vitest run tests/unit/menus/bot-menu.factory.test.ts tests/unit/menus/lifecycle-menu.factory.test.ts
```

Expected: FAIL because the current menus do not yet expose the approved iconography and row layout.

- [ ] **Step 3: Commit the RED tests**

```powershell
git add modules/bot-management/tests/unit/menus
git commit -m "test(bot-management): define ux helper menu acceptance"
```

### Task 2: Rework Bot List and Detail Menus Around `ux-helpers`

**Files:**
- Modify: `modules/bot-management/menus/bot-menu.factory.ts`
- Modify: `modules/bot-management/locales/ar.json`
- Modify: `modules/bot-management/locales/en.json`
- Test: `modules/bot-management/tests/unit/menus/bot-menu.factory.test.ts`

- [ ] **Step 1: Implement localized icon-prefixed labels**

Add localized labels similar to:

```json
{
  "menu": {
    "create": "➕ New bot",
    "refresh": "🔄 Refresh",
    "back": "↩️ Back",
    "lifecycle": "🔁 Lifecycle",
    "settings": "⚙️ Settings",
    "modules": "📦 Modules"
  }
}
```

Mirror the same structure in Arabic with natural wording and the approved
leading icons.

- [ ] **Step 2: Rebuild the factories with `createInlineKeyboard` where it fits**

Implementation target:

```ts
const builder = createInlineKeyboard();
builder.button({ label: t('bot-management.menu.create'), callbackData: 'botmgmt:create' });
builder.button({ label: t('bot-management.menu.refresh'), callbackData: `botmgmt:list:${page}` });
return builder.toGrammyKeyboard();
```

Use row boundaries intentionally for:

- bot detail action pairs
- single-row return action
- long bot labels that should remain standalone

- [ ] **Step 3: Run focused tests**

```powershell
pnpm --filter bot-management exec vitest run tests/unit/menus/bot-menu.factory.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit the implementation**

```powershell
git add modules/bot-management/menus/bot-menu.factory.ts modules/bot-management/locales/ar.json modules/bot-management/locales/en.json modules/bot-management/tests/unit/menus/bot-menu.factory.test.ts
git commit -m "feat(bot-management): standardize bot menus with ux helpers"
```

### Task 3: Rework Lifecycle and Archive Menus

**Files:**
- Modify: `modules/bot-management/menus/lifecycle-menu.factory.ts`
- Modify: `modules/bot-management/locales/ar.json`
- Modify: `modules/bot-management/locales/en.json`
- Test: `modules/bot-management/tests/unit/menus/lifecycle-menu.factory.test.ts`

- [ ] **Step 1: Add failing lifecycle tests**

Cover:

```ts
it('should show pause and archive actions with operational icons', () => {
  const keyboard = createLifecycleMenu(t, activeBotFixture);
  expect(flattenKeyboard(keyboard)).toContain('⏸️ Pause');
  expect(flattenKeyboard(keyboard)).toContain('🗄️ Archive');
});
```

```ts
it('should keep archive confirmation compact and explicit', () => {
  const keyboard = createArchiveConfirmationMenu(t, 'bot-1');
  expect(extractRows(keyboard)).toEqual([
    ['🗄️ Confirm archive'],
    ['↩️ Back'],
  ]);
});
```

- [ ] **Step 2: Run lifecycle tests to confirm RED**

```powershell
pnpm --filter bot-management exec vitest run tests/unit/menus/lifecycle-menu.factory.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement the lifecycle menu layout using `ux-helpers`**

Target behavior:

- lifecycle transitions use icon-prefixed labels
- archive action is visually distinct
- back stays on its own row
- archive confirmation avoids crowding destructive and navigational actions

- [ ] **Step 4: Run lifecycle tests**

```powershell
pnpm --filter bot-management exec vitest run tests/unit/menus/lifecycle-menu.factory.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add modules/bot-management/menus/lifecycle-menu.factory.ts modules/bot-management/locales/ar.json modules/bot-management/locales/en.json modules/bot-management/tests/unit/menus/lifecycle-menu.factory.test.ts
git commit -m "feat(bot-management): refine lifecycle menus for mobile ux"
```

### Task 4: Align Registration Prompt Presentation Boundaries

**Files:**
- Modify: `modules/bot-management/flows/bot-registration.flow.ts`
- Test: relevant flow or unit test under `modules/bot-management/tests/`

- [ ] **Step 1: Write the smallest failing test for prompt keyboard output**

The test should verify that:

- module-owned prompt rendering still preserves expected callback targets
- no manual divergence from the approved button ordering is introduced
- any remaining raw `inline_keyboard` path is justified because it mirrors
  `@tempot/input-engine` action rows directly

- [ ] **Step 2: Run the focused flow test and confirm RED if behavior changes**

```powershell
pnpm --filter bot-management exec vitest run tests
```

Expected: FAIL only for the newly defined behavior, if a code change is needed.

- [ ] **Step 3: Implement the minimal registration presentation alignment**

If `createPromptKeyboard` can compose an existing helper without distorting
`input-engine` output, do so. Otherwise, keep the transformation local and add
a short code comment documenting that the payload is a direct adapter over
`input-engine` rows rather than a competing menu implementation.

- [ ] **Step 4: Run bot-management tests**

```powershell
pnpm --filter bot-management test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add modules/bot-management/flows/bot-registration.flow.ts modules/bot-management/tests
git commit -m "refactor(bot-management): align registration prompt ux boundary"
```

### Task 5: Verify Documentation and Package-Reuse Consistency

**Files:**
- Modify if needed:
  - `docs/developer/module-capability-reuse-standard.md`
  - `docs/developer/module-development-catalog.md`
  - `docs/superpowers/specs/2026-05-13-bot-management-ux-helpers-reference-standard-design.md`

- [ ] **Step 1: Cross-check implementation against the approved design**

Confirm:

- bot-management menus match the approved icon map
- `@tempot/ux-helpers` is now visibly adopted in the module menus
- any remaining raw keyboard rendering has a documented rationale
- docs match the implemented reference pattern

- [ ] **Step 2: Run documentation and methodology gates**

```powershell
pnpm spec:validate
pnpm cms:check
git diff --check
```

Expected: all commands exit with code `0`.

- [ ] **Step 3: Commit documentation reconciliation**

```powershell
git add docs modules/bot-management
git commit -m "docs(modules): document ux helpers reference standard"
```

### Task 6: Final Verification Before Integration

**Files:**
- No new source files unless verification exposes a defect.

- [ ] **Step 1: Run focused and project-level gates**

```powershell
pnpm --filter bot-management test
pnpm lint
pnpm build
pnpm test:unit
pnpm spec:validate
pnpm cms:check
git diff --check
```

Expected: all commands exit with code `0`.

- [ ] **Step 2: Perform manual Telegram verification**

Check from the running bot:

1. `/bots`
2. bot detail view
3. lifecycle menu
4. archive confirmation menu
5. `/new_bot` prompt actions

Verify:

- labels are localized
- icon prefixes look balanced
- button grouping is readable on mobile
- navigation and callbacks still work

- [ ] **Step 3: Produce merge-ready handoff**

Summarize:

- exact menus changed
- any raw keyboard path intentionally retained
- verification commands and results
- whether the reference standard is ready to generalize to the next module
