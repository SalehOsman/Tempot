# User Management Module — Task Breakdown

**Feature:** 025-user-management
**Source:** spec.md (Approved) + plan.md (Approved)
**Generated:** 2026-04-26

---

## Task 0: Branch Creation & Validation

**Priority:** P0 (prerequisite for all other tasks)
**Estimated time:** 5 min
**FR:** None (infrastructure)

**Steps**:
1. Create feature branch: `git checkout -b feature/025-user-management`
2. Verify clean workspace: `git status` (no uncommitted changes)
3. Verify all tests pass: `pnpm test`
4. Verify no lint errors: `pnpm lint`

**Acceptance criteria**:
- [x] Branch created successfully
- [ ] Clean workspace (no uncommitted changes)
- [ ] All tests pass
- [ ] No lint errors

---

## Task 1: Module Scaffolding

**Priority:** P0 (prerequisite for all other tasks)
**Estimated time:** 1 day
**FR**: None (infrastructure)

**Files to create**:
- `apps/bot-server/modules/user-management/module.config.ts`
- `apps/bot-server/modules/user-management/abilities.ts`
- `apps/bot-server/modules/user-management/locales/ar.json`
- `apps/bot-server/modules/user-management/locales/en.json`
- `apps/bot-server/modules/user-management/commands/` directory
- `apps/bot-server/modules/user-management/menus/` directory
- `apps/bot-server/modules/user-management/handlers/` directory
- `apps/bot-server/modules/user-management/services/` directory
- `apps/bot-server/modules/user-management/repositories/` directory
- `apps/bot-server/modules/user-management/types/` directory
- `apps/bot-server/modules/user-management/tests/` directory

**Acceptance criteria**:
- [ ] module.config.ts exists with proper structure
- [ ] abilities.ts exists with CASL abilities
- [ ] locales/ar.json exists with translations
- [ ] locales/en.json exists with translations
- [ ] All directories created
- [ ] Follows Rule XLVI (Module Creation Gate)

---

## Task 2: Main Menu Factory

**Priority:** P0 (core functionality)
**Estimated time:** 0.5 days
**FR**: FR-001 (Profile Management via Buttons)

**Files to create**:
- `apps/bot-server/modules/user-management/menus/main-menu.factory.ts`

**Packages used**:
- **@tempot/ux-helpers**: createInlineKeyboard() for keyboard creation
- **@tempot/auth-core**: RoleEnum for role checking

**Implementation**:
- Create main menu Inline Keyboard based on user role
- Use `createInlineKeyboard()` from @tempot/ux-helpers
- 2-3 buttons per row for readability
- Max 12 buttons per keyboard
- Emoji icons for visual clarity
- Conditional buttons based on user role

**Acceptance criteria**:
- [ ] MainMenuFactory.create() exists
- [ ] Uses createInlineKeyboard() from @tempot/ux-helpers
- [ ] Creates Inline Keyboard with proper structure
- [ ] 2-3 buttons per row
- [ ] Max 12 buttons
- [ ] Emoji icons used
- [ ] Admin buttons shown for admin users
- [ ] No admin buttons for regular users

---

## Task 3: Profile Menu Factory

**Priority:** P0 (core functionality)
**Estimated time:** 0.5 days
**FR**: FR-001 (Profile Management via Buttons)

**Files to create**:
- `apps/bot-server/modules/user-management/menus/profile-menu.factory.ts`

**Packages used**:
- **@tempot/ux-helpers**: createInlineKeyboard(), formatSuccess(), formatError()
- **@tempot/regional-engine**: formatDate(), formatNumber() for stats display
- **@tempot/i18n-core**: t() for all text

**Implementation**:
- Create profile view Inline Keyboard using createInlineKeyboard()
- Create profile edit Inline Keyboard using createInlineKeyboard()
- Create profile stats Inline Keyboard using createInlineKeyboard()
- Use formatDate() from @tempot/regional-engine for date display
- Use formatNumber() from @tempot/regional-engine for number display
- Back button on all screens

**Acceptance criteria**:
- [ ] ProfileMenuFactory.createView() exists
- [ ] ProfileMenuFactory.createEdit() exists
- [ ] ProfileMenuFactory.createStats() exists
- [ ] Uses createInlineKeyboard() from @tempot/ux-helpers
- [ ] Uses formatDate() from @tempot/regional-engine
- [ ] Uses formatNumber() from @tempot/regional-engine
- [ ] All keyboards have back buttons
- [ ] 2-3 buttons per row
- [ ] Max 12 buttons
- [ ] Emoji icons used

---

## Task 4: Users Menu Factory

**Priority:** P0 (core functionality)
**Estimated time:** 0.5 days
**FR**: FR-002 (User Search via Buttons), FR-003 (Role Management via Buttons)

**Files to create**:
- `apps/bot-server/modules/user-management/menus/users-menu.factory.ts`

**Packages used**:
- **@tempot/ux-helpers**: createInlineKeyboard(), createConfirmation(), formatSuccess(), formatError()
- **@tempot/auth-core**: RoleEnum for role options
- **@tempot/i18n-core**: t() for all text

**Implementation**:
- Create users list Inline Keyboard using createInlineKeyboard()
- Create search results Inline Keyboard using createInlineKeyboard()
- Create role change Inline Keyboard using createInlineKeyboard()
- Create confirmation Inline Keyboard using createConfirmation()
- Back button on all screens

**Acceptance criteria**:
- [ ] UsersMenuFactory.createList() exists
- [ ] UsersMenuFactory.createSearchResults() exists
- [ ] UsersMenuFactory.createRoleChange() exists
- [ ] UsersMenuFactory.createConfirm() exists
- [ ] Uses createInlineKeyboard() from @tempot/ux-helpers
- [ ] Uses createConfirmation() from @tempot/ux-helpers
- [ ] All keyboards have back buttons
- [ ] 2-3 buttons per row
- [ ] Max 12 buttons
- [ ] Emoji icons used

---

## Task 5: Start Command Handler

**Priority:** P0 (core functionality)
**Estimated time:** 0.5 days
**FR**: FR-004 (Command Shortcuts)

**Files to create**:
- `apps/bot-server/modules/user-management/commands/start.command.ts`

**Implementation**:
- Handle `/start` command
- Fetch user from database
- Create main menu via MainMenuFactory
- Display main menu with Inline Keyboard

**Acceptance criteria**:
- [ ] startCommand() exists
- [ ] Fetches user from database
- [ ] Creates main menu via MainMenuFactory
- [ ] Displays main menu with Inline Keyboard
- [ ] Handles errors gracefully

---

## Task 6: Profile Command Handler

**Priority:** P1 (shortcut functionality)
**Estimated time:** 0.5 days
**FR**: FR-004 (Command Shortcuts)

**Files to create**:
- `apps/bot-server/modules/user-management/commands/profile.command.ts`

**Implementation**:
- Handle `/profile` command
- Fetch user from database
- Create profile view via ProfileMenuFactory
- Display profile view with Inline Keyboard

**Acceptance criteria**:
- [ ] profileCommand() exists
- [ ] Fetches user from database
- [ ] Creates profile view via ProfileMenuFactory
- [ ] Displays profile view with Inline Keyboard
- [ ] Handles errors gracefully

---

## Task 7: Users Command Handler

**Priority:** P1 (shortcut functionality)
**Estimated time:** 0.5 days
**FR**: FR-004 (Command Shortcuts)

**Files to create**:
- `apps/bot-server/modules/user-management/commands/users.command.ts`

**Implementation**:
- Handle `/users` command
- Check authorization (admin only)
- Create users menu via UsersMenuFactory
- Display users menu with Inline Keyboard

**Acceptance criteria**:
- [ ] usersCommand() exists
- [ ] Checks authorization (admin only)
- [ ] Creates users menu via UsersMenuFactory
- [ ] Displays users menu with Inline Keyboard
- [ ] Handles unauthorized access gracefully

---

## Task 8: Callback Query Handler

**Priority:** P0 (core functionality)
**Estimated time:** 1 day
**FR**: FR-001, FR-002, FR-003, FR-005 (Navigation Consistency)

**Files to create**:
- `apps/bot-server/modules/user-management/handlers/callback.handler.ts`

**Implementation**:
- Handle all Inline Keyboard button clicks
- Route to appropriate action handler
- Handle profile actions
- Handle users actions
- Handle menu actions
- Handle settings actions

**Acceptance criteria**:
- [ ] handleCallbackQuery() exists
- [ ] Routes to appropriate action handler
- [ ] Handles profile actions
- [ ] Handles users actions
- [ ] Handles menu actions
- [ ] Handles settings actions
- [ ] Handles unknown actions gracefully

---

## Task 9: Text Handler

**Priority:** P0 (core functionality)
**Estimated time:** 1 day
**FR**: FR-001 (Profile Management via Buttons), FR-002 (User Search via Buttons)

**Files to create**:
- `apps/bot-server/modules/user-management/handlers/text.handler.ts`

**Packages used**:
- **@tempot/input-engine**: Dynamic form schema for profile editing
- **@tempot/ux-helpers**: formatSuccess(), formatError(), formatWarning()
- **@tempot/i18n-core**: t() for all text

**Implementation**:
- Create profile edit schema using InputEngine
- Handle text input for form fields via InputEngine
- Handle name update via InputEngine (ShortText field)
- Handle email update via InputEngine (Email field)
- Handle language update via InputEngine (SingleChoice field)
- Handle user search query (manual implementation)
- Validate all inputs via InputEngine

**Acceptance criteria**:
- [ ] handleTextInput() exists
- [ ] Uses InputEngine for profile editing
- [ ] Handles name update via InputEngine
- [ ] Handles email update via InputEngine
- [ ] Handles language update via InputEngine
- [ ] Handles user search query
- [ ] Validates all inputs via InputEngine
- [ ] Handles invalid inputs gracefully

---

## Task 10: User Service

**Priority:** P0 (core functionality)
**Estimated time:** 1 day
**FR**: FR-001, FR-002, FR-003

**Files to create**:
- `apps/bot-server/modules/user-management/services/user.service.ts`

**Implementation**:
- getByTelegramId() with caching
- getById() with caching
- updateUsername() with cache invalidation
- updateEmail() with cache invalidation
- updateLanguage() with cache invalidation
- searchUsers()

**Acceptance criteria**:
- [ ] getByTelegramId() exists with caching
- [ ] getById() exists with caching
- [ ] updateUsername() exists with cache invalidation
- [ ] updateEmail() exists with cache invalidation
- [ ] updateLanguage() exists with cache invalidation
- [ ] searchUsers() exists
- [ ] All methods return Result pattern
- [ ] Cache TTL is 5 minutes

---

## Task 11: Role Service

**Priority:** P0 (core functionality)
**Estimated time:** 0.5 days
**FR**: FR-003 (Role Management via Buttons)

**Files to create**:
- `apps/bot-server/modules/user-management/services/role.service.ts`

**Implementation**:
- changeRole() with validation
- Validate role
- Check if role is already the same
- Update role
- Invalidate cache
- Publish event

**Acceptance criteria**:
- [ ] changeRole() exists
- [ ] Validates role
- [ ] Checks if role is already the same
- [ ] Updates role
- [ ] Invalidates cache
- [ ] Publishes event
- [ ] Returns Result pattern

---

## Task 12: User Repository

**Priority:** P0 (core functionality)
**Estimated time:** 0.5 days
**FR**: FR-001, FR-002, FR-003

**Files to create**:
- `apps/bot-server/modules/user-management/repositories/user.repository.ts`

**Implementation**:
- findByTelegramId()
- findById()
- updateUsername()
- updateEmail()
- updateLanguage()
- updateRole()
- search()

**Acceptance criteria**:
- [ ] findByTelegramId() exists
- [ ] findById() exists
- [ ] updateUsername() exists
- [ ] updateEmail() exists
- [ ] updateLanguage() exists
- [ ] updateRole() exists
- [ ] search() exists
- [ ] All methods return Result pattern

---

## Task 13: Type Definitions

**Priority:** P0 (prerequisite for all other tasks)
**Estimated time:** 0.5 days
**FR**: None (infrastructure)

**Files to create**:
- `apps/bot-server/modules/user-management/types/user.types.ts`
- `apps/bot-server/modules/user-management/types/menu.types.ts`
- `apps/bot-server/modules/user-management/types/navigation.types.ts`

**Implementation**:
- UserProfile interface
- UserRole enum
- MenuAction type
- NavigationState type

**Acceptance criteria**:
- [ ] UserProfile interface exists
- [ ] UserRole enum exists
- [ ] MenuAction type exists
- [ ] NavigationState type exists
- [ ] All types are properly typed

---

## Task 14: Unit Tests - Menu Factories

**Priority:** P0 (quality gate)
**Estimated time:** 0.5 days
**FR**: None (quality gate)

**Files to create**:
- `apps/bot-server/modules/user-management/tests/unit/menus/main-menu.factory.test.ts`
- `apps/bot-server/modules/user-management/tests/unit/menus/profile-menu.factory.test.ts`
- `apps/bot-server/modules/user-management/tests/unit/menus/users-menu.factory.test.ts`

**Tests**:
- MainMenuFactory creates proper keyboard for regular user
- MainMenuFactory includes admin buttons for admin users
- MainMenuFactory has 2-3 buttons per row
- MainMenuFactory has max 12 buttons
- ProfileMenuFactory creates proper keyboards
- UsersMenuFactory creates proper keyboards

**Acceptance criteria**:
- [ ] Unit tests exist for MainMenuFactory
- [ ] Unit tests exist for ProfileMenuFactory
- [ ] Unit tests exist for UsersMenuFactory
- [ ] All tests pass
- [ ] Coverage > 80%

---

## Task 15: Unit Tests - Services

**Priority:** P0 (quality gate)
**Estimated time:** 0.5 days
**FR**: None (quality gate)

**Files to create**:
- `apps/bot-server/modules/user-management/tests/unit/services/user.service.test.ts`
- `apps/bot-server/modules/user-management/tests/unit/services/role.service.test.ts`

**Tests**:
- UserService.getByTelegramId() with caching
- UserService.getById() with caching
- UserService.updateUsername() with cache invalidation
- UserService.searchUsers()
- RoleService.changeRole() with validation

**Acceptance criteria**:
- [ ] Unit tests exist for UserService
- [ ] Unit tests exist for RoleService
- [ ] All tests pass
- [ ] Coverage > 80%

---

## Task 16: Integration Tests - Profile Flow

**Priority:** P0 (quality gate)
**Estimated time:** 1 day
**FR**: FR-001, FR-005

**Files to create**:
- `apps/bot-server/modules/user-management/tests/integration/profile-flow.test.ts`

**Tests**:
- Complete profile edit flow
- Profile view → edit → name → save
- Profile view → edit → email → save
- Profile view → edit → language → save
- Profile view → stats → back

**Acceptance criteria**:
- [ ] Integration tests exist for profile flow
- [ ] All tests pass
- [ ] All user stories tested

---

## Task 17: Integration Tests - User Management Flow

**Priority:** P0 (quality gate)
**Estimated time:** 1 day
**FR**: FR-002, FR-003

**Files to create**:
- `apps/bot-server/modules/user-management/tests/integration/user-management-flow.test.ts`

**Tests**:
- Complete user management flow
- Users list → search → results → view
- User view → role change → confirm
- Unauthorized access handling

**Acceptance criteria**:
- [ ] Integration tests exist for user management flow
- [ ] All tests pass
- [ ] All user stories tested

---

## Task 18: E2E Tests

**Priority:** P1 (quality gate)
**Estimated time:** 1 day
**FR**: FR-001, FR-002, FR-003, FR-005

**Files to create**:
- `apps/bot-server/modules/user-management/tests/e2e/user-management.e2e.test.ts`

**Tests**:
- Full user management scenario
- Admin changes user role
- User edits profile
- Navigation consistency

**Acceptance criteria**:
- [ ] E2E tests exist
- [ ] All tests pass
- [ ] Key scenarios tested

---

## Task 18A: Performance Benchmark - Inline Keyboard Latency

**Priority:** P1 (NFR validation)
**Estimated time:** 0.5 days
**NFR:** Response Time < 500ms for Inline Keyboard interactions

**Files to create**:
- `modules/user-management/tests/integration/inline-keyboard-latency.test.ts`

**Benchmark scope**:
- Profile menu rendering latency
- User search result keyboard rendering latency
- Role confirmation keyboard rendering latency

**Acceptance criteria**:
- [ ] Benchmark test exists for Inline Keyboard interactions
- [ ] Average interaction response time is < 500ms
- [ ] Regression threshold is documented in the test

---

## Task 19: Verification & Validation

**Priority:** P0 (quality gate)
**Estimated time:** 1 day
**FR**: None (quality gate)

**Steps**:
1. Run spec validation: `pnpm spec:validate`
2. Run all tests: `pnpm test`
3. Run lint: `pnpm lint`
4. Run typecheck: `pnpm typecheck`

**Expected results**:
- `pnpm spec:validate` passes with zero CRITICAL issues
- All tests pass
- No lint errors
- No TypeScript errors

**Acceptance criteria**:
- [ ] `pnpm spec:validate` passes with zero CRITICAL issues
- [ ] All tests pass
- [ ] No lint errors
- [ ] No TypeScript errors
- [ ] No build errors

---

## Task 20: Documentation Updates

**Priority:** P1 (documentation)
**Estimated time:** 1 day
**FR**: None (documentation)

**Files to update**:
- `apps/bot-server/modules/user-management/README.md` (create)
- `f:\Tempot\docs/archive/ROADMAP.md` (update)
- `f:\Tempot\CHANGELOG.md` (update)

**Acceptance criteria**:
- [ ] README.md exists with proper structure
- [ ] ROADMAP.md updated with user-management entry
- [ ] CHANGELOG.md updated with entry
- [ ] Follows Rule LX (Package README Requirement)

---

## Task 21: Final Review & Commit

**Priority:** P0 (quality gate)
**Estimated time:** 0.5 days
**FR**: None (quality gate)

**Steps**:
1. Manual review of all changed files
2. Verify all acceptance criteria met
3. Commit with conventional commit message
4. Verify commit passes all checks

**Commit message**:
```
feat(user-management): add user management module with inline keyboard UI

- Implement profile management via Inline Keyboards (90%)
- Implement user search and management for admins
- Implement role management for admins
- Add navigation system with back buttons
- Add command shortcuts for power users
- Add comprehensive unit, integration, and E2E tests
- Follow SpecKit + Superpowers methodology

Closes: #025
```

**Acceptance criteria**:
- [ ] All changed files reviewed manually
- [ ] All acceptance criteria from Tasks 1-20 met
- [ ] Commit created with conventional commit message
- [ ] Commit passes all checks

---

## Task Dependencies

```
Task 0 (Branch Creation)
  ↓
Task 1 (Module Scaffolding)
  ↓
Task 13 (Type Definitions) ──┐
  ↓                         │
Task 2 (Main Menu Factory) ──┤
  ↓                         │
Task 3 (Profile Menu Factory) │
  ↓                         │
Task 4 (Users Menu Factory)   │
  ↓                         │
Task 5 (Start Command) ───────┤
  ↓                         │
Task 6 (Profile Command) ────┤
  ↓                         │
Task 7 (Users Command) ──────┤
  ↓                         │
Task 8 (Callback Handler) ──┤
  ↓                         │
Task 9 (Text Handler) ───────┤
  ↓                         │
Task 10 (User Service) ───────┤
  ↓                         │
Task 11 (Role Service) ───────┤
  ↓                         │
Task 12 (User Repository) ────┘
  ↓
Task 14 (Unit Tests - Menu Factories)
Task 15 (Unit Tests - Services) ──┐
  ↓                               │
Task 16 (Integration Tests - Profile Flow)
Task 17 (Integration Tests - User Management Flow) ──┐
  ↓                                                   │
Task 18 (E2E Tests) ──────────────────────────────────┘
  ↓
Task 19 (Verification & Validation)
  ↓
Task 20 (Documentation Updates)
  ↓
Task 21 (Final Review & Commit)
```

---

## Total Estimated Time

- Task 0: 5 min
- Task 1: 1 day
- Task 2: 0.5 days
- Task 3: 0.5 days
- Task 4: 0.5 days
- Task 5: 0.5 days
- Task 6: 0.5 days
- Task 7: 0.5 days
- Task 8: 1 day
- Task 9: 1 day
- Task 10: 1 day
- Task 11: 0.5 days
- Task 12: 0.5 days
- Task 13: 0.5 days
- Task 14: 0.5 days
- Task 15: 0.5 days
- Task 16: 1 day
- Task 17: 1 day
- Task 18: 1 day
- Task 19: 1 day
- Task 20: 1 day
- Task 21: 0.5 days

**Total**: ~14 days (2 weeks)

---

## Note: SpecKit Methodology Compliance

This tasks.md file follows the SpecKit + Superpowers methodology:

- ✅ All tasks are prioritized (P0, P1)
- ✅ All tasks have estimated time
- ✅ All tasks are linked to Functional Requirements (FR)
- ✅ All tasks have clear acceptance criteria
- ✅ Task dependencies are clearly defined
- ✅ Total estimated time is provided
- ✅ Follows Constitution Rule XXXIV (TDD Mandatory)
- ✅ Follows Constitution Rule XXXVII (Test Naming Convention)
