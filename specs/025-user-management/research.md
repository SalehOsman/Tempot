# User Management Module — Technical Research

**Feature:** 025-user-management
**Source:** spec.md + plan.md
**Generated:** 2026-04-26

---

## Overview

This is a **user management module** with moderate technical research required. The module focuses on Inline Keyboard interactions and follows existing infrastructure patterns.

---

## Research Topic 1: Inline Keyboard Best Practices

### Question

What are the best practices for Inline Keyboard design in Telegram bots?

### Investigation

**Sources Checked**:
1. Telegram Bot API documentation
2. grammY documentation
3. ADR-016: Inline Keyboard Best Practices
4. Existing bot-server modules (test-module)

### Findings

**Telegram Inline Keyboard Guidelines**:
- **Buttons per row**: 2-3 recommended for readability
- **Max buttons per keyboard**: 12 (Telegram limit)
- **Button text**: Max 64 characters
- **Callback data**: Max 64 bytes
- **Emoji icons**: Recommended for visual clarity
- **Back navigation**: Required on all non-root screens

**grammY Inline Keyboard API**:
```typescript
import { InlineKeyboard } from 'grammy';

const keyboard = new InlineKeyboard()
  .text('Button 1', 'callback_data_1')
  .text('Button 2', 'callback_data_2')
  .row()
  .text('Button 3', 'callback_data_3')
  .text('Button 4', 'callback_data_4');
```

**Best Practices**:
1. **Consistent layout**: Same number of buttons per row
2. **Clear labels**: Short, descriptive text with emoji
3. **Logical grouping**: Related buttons together
4. **Back navigation**: Always provide back button
5. **Confirmation dialogs**: For destructive actions

### Decision

Follow Telegram Inline Keyboard best practices:
- 2-3 buttons per row
- Max 12 buttons per keyboard
- Emoji icons for visual clarity
- Back button on all non-root screens
- Confirmation dialogs for destructive actions

### References

- Telegram Bot API: https://core.telegram.org/bots/api#inlinekeyboardmarkup
- grammY Documentation: https://grammy.dev/guide/keyboards.html
- ADR-016: Inline Keyboard Best Practices

---

## Research Topic 2: State Management for Navigation

### Question

How should we manage navigation state for Inline Keyboard interactions?

### Investigation

**Sources Checked**:
1. `@tempot/session-manager` package
2. Existing bot-server modules
3. grammY session middleware
4. Constitution Rule XXVII: Soft Delete

### Findings

**Session Manager API**:
```typescript
interface ISessionProvider {
  getSession(userId: string): AsyncResult<Session | null, AppError>;
  createSession(userId: string, data: Partial<Session>): AsyncResult<Session, AppError>;
  updateSession(userId: string, data: Partial<Session>): AsyncResult<Session, AppError>;
  deleteSession(userId: string): AsyncResult<void, AppError>;
}
```

**grammY Session Middleware**:
```typescript
import { session } from 'grammy';

bot.use(session({
  initial: () => ({
    navigation: null,
    pendingAction: null
  })
}));
```

**Navigation State Structure**:
```typescript
interface NavigationState {
  action: string;
  userId?: string;
  pendingRoleChange?: {
    userId: string;
    newRole: UserRole;
  };
  timestamp: number;
}
```

**Best Practices**:
1. Store navigation state in session
2. Use timestamps for state expiration
3. Clear state after action completion
4. Handle state loss gracefully (bot restart)

### Decision

Use session-manager for navigation state:
- Store navigation state in session
- Use timestamps for expiration (5 minutes)
- Clear state after action completion
- Handle state loss gracefully (return to main menu)

### References

- session-manager README.md: Session provider API
- grammY Documentation: https://grammy.dev/plugins/session.html
- Constitution Rule XXVII: Soft Delete

---

## Research Topic 3: User Search Implementation

### Question

How should we implement user search efficiently?

### Investigation

**Sources Checked**:
1. `@tempot/database` package
2. PostgreSQL full-text search capabilities
3. Existing search implementations in bot-server
4. Performance considerations

### Findings

**PostgreSQL Search Options**:
1. **LIKE operator**: Simple but slow for large datasets
2. **ILIKE operator**: Case-insensitive LIKE
3. **Full-text search**: tsvector, tsquery (complex but fast)
4. **pg_trgm extension**: Trigram matching (good for fuzzy search)

**LIKE Query Example**:
```sql
SELECT * FROM users 
WHERE username LIKE '%query%' 
   OR email LIKE '%query%'
LIMIT 10;
```

**Performance Considerations**:
- **Indexes**: Create indexes on username and email
- **Pagination**: Limit results to 10 per page
- **Cache**: Cache search results for 5 minutes
- **Debouncing**: Debounce search input (500ms)

**Best Practices**:
1. Use ILIKE for case-insensitive search
2. Limit results to 10 per page
3. Create indexes on search fields
4. Cache search results
5. Debounce search input

### Decision

Use ILIKE with indexes and pagination:
- ILIKE for case-insensitive search
- Limit 10 results per page
- Create indexes on username and email
- Cache search results for 5 minutes
- Debounce search input (500ms)

### References

- PostgreSQL Documentation: https://www.postgresql.org/docs/current/functions-matching.html
- database README.md: Repository pattern
- ADR-017: Search Implementation Strategy

---

## Research Topic 4: Role Authorization

### Question

How should we implement role-based authorization?

### Investigation

**Sources Checked**:
1. `@tempot/auth-core` package
2. CASL documentation
3. Constitution Rule XLV: Authorization Gate
4. Existing authorization implementations

### Findings

**CASL Authorization**:
```typescript
import { Ability, AbilityBuilder } from '@casl/ability';

export function defineAbility(user: UserProfile): Ability {
  const { can, cannot, build } = new AbilityBuilder(Ability);

  if (user.role === 'SUPER_ADMIN') {
    can('manage', 'all');
  } else if (user.role === 'ADMIN') {
    can('manage', 'users');
    can('read', 'all');
  } else if (user.role === 'MODERATOR') {
    can('read', 'users');
    can('update', 'users');
  } else if (user.role === 'USER') {
    can('read', 'own');
    can('update', 'own');
  }

  return build();
}
```

**Authorization Check**:
```typescript
const ability = defineAbility(user);

if (ability.can('manage', 'users')) {
  // Allow user management
} else {
  // Deny access
}
```

**Best Practices**:
1. Define abilities based on user role
2. Check permissions before actions
3. Provide clear error messages for unauthorized access
4. Log unauthorized access attempts

### Decision

Use CASL for role-based authorization:
- Define abilities based on user role
- Check permissions before actions
- Provide clear error messages for unauthorized access
- Log unauthorized access attempts

### References

- CASL Documentation: https://casl.js.org/v5/en/guide
- auth-core README.md: CASL integration
- Constitution Rule XLV: Authorization Gate

---

## Research Topic 5: Input Validation

### Question

How should we validate user inputs?

### Investigation

**Sources Checked**:
1. Zod validation library
2. Existing validation implementations in bot-server
3. Constitution Rule XXXVIII: Zero-Defect Gate
4. Security best practices

### Findings

**Zod Validation**:
```typescript
import { z } from 'zod';

export const usernameSchema = z.string()
  .min(1, 'الاسم لا يمكن أن يكون فارغاً')
  .max(50, 'الاسم طويل جداً (حد أقصى 50 حرف)')
  .regex(/^[a-zA-Z\u0600-\u06FF\s]+$/, 'الاسم يحتوي على أحرف غير صالحة');

export const emailSchema = z.string()
  .email('البريد الإلكتروني غير صالح')
  .max(255, 'البريد الإلكتروني طويل جداً (حد أقصى 255 حرف)')
  .optional();
```

**Validation Flow**:
```typescript
const result = usernameSchema.safeParse(input);

if (!result.success) {
  const errors = result.error.errors;
  // Display error message to user
  return;
}

const validatedData = result.data;
// Proceed with validated data
```

**Best Practices**:
1. Validate all user inputs
2. Use Zod for schema validation
3. Provide clear error messages
4. Sanitize inputs before database operations

### Decision

Use Zod for input validation:
- Validate all user inputs
- Use Zod schemas for validation
- Provide clear error messages in Arabic
- Sanitize inputs before database operations

### References

- Zod Documentation: https://zod.dev/
- Constitution Rule XXXVIII: Zero-Defect Gate
- ADR-018: Input Validation Strategy

---

## Research Topic 6: Error Handling

### Question

How should we handle errors gracefully?

### Investigation

**Sources Checked**:
1. `@tempot/shared` package (AppError, Result pattern)
2. neverthrow documentation
3. Constitution Rule XXI: Result Pattern
4. Existing error handling implementations

### Findings

**Result Pattern**:
```typescript
import { Result, ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';

async function updateUser(userId: string, data: UpdateUserData): Promise<Result<User, AppError>> {
  try {
    const user = await UserRepository.findById(userId);
    if (!user) {
      return err(new AppError('user_not_found', 'المستخدم غير موجود'));
    }
    
    const updatedUser = await UserRepository.update(userId, data);
    return ok(updatedUser);
  } catch (error) {
    return err(new AppError('database_error', 'خطأ في قاعدة البيانات'));
  }
}
```

**Error Display**:
```typescript
const result = await updateUser(userId, data);

if (result.isErr()) {
  const error = result.error;
  await ctx.reply(`❌ ${error.message}`);
  return;
}

const user = result.value;
await ctx.reply('✅ تم تحديث المستخدم بنجاح');
```

**Best Practices**:
1. Use Result pattern for all operations
2. Provide clear error messages in Arabic
3. Handle errors gracefully
4. Log errors for debugging

### Decision

Use Result pattern for error handling:
- Use Result pattern for all operations
- Provide clear error messages in Arabic
- Handle errors gracefully
- Log errors for debugging

### References

- neverthrow Documentation: https://github.com/supermacro/neverthrow
- shared README.md: Result pattern, AppError
- Constitution Rule XXI: Result Pattern

---

## Research Topic 7: Testing Strategy

### Question

How should we test the user management module?

### Investigation

**Sources Checked**:
1. Vitest documentation
2. Testcontainers documentation
3. Constitution Rule XXXIV: TDD Mandatory
4. Existing test implementations in bot-server

### Findings

**Test Structure**:
```
tests/
  unit/
    menus/main-menu.factory.test.ts
    menus/profile-menu.factory.test.ts
    menus/users-menu.factory.test.ts
    services/user.service.test.ts
    services/role.service.test.ts
  integration/
    profile-flow.test.ts
    user-management-flow.test.ts
  e2e/
    user-management.e2e.test.ts
```

**Unit Tests**:
```typescript
describe('MainMenuFactory', () => {
  it('should create main menu for regular user', () => {
    const user: UserProfile = {
      id: '1',
      telegramId: '123456789',
      role: UserRole.USER,
      language: 'ar',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const keyboard = MainMenuFactory.create(user);
    
    expect(keyboard.inline_keyboard).toBeDefined();
    expect(keyboard.inline_keyboard.length).toBeGreaterThan(0);
  });
});
```

**Integration Tests**:
```typescript
describe('Profile Flow', () => {
  it('should complete profile edit flow', async () => {
    const bot = createMockBot();
    const module = new UserManagementModule(bot);
    
    // Step 1: User sends /start
    await bot.handleUpdate({ message: { text: '/start' } });
    
    // Step 2: User clicks profile button
    await bot.handleUpdate({ callback_query: { data: 'profile:view' } });
    
    // Step 3: User clicks edit button
    await bot.handleUpdate({ callback_query: { data: 'profile:edit' } });
    
    // Verify flow completed successfully
    const lastMessage = bot.lastMessage();
    expect(lastMessage.text).toContain('✏️ تعديل الملف الشخصي');
  });
});
```

**E2E Tests**:
```typescript
describe('User Management E2E', () => {
  it('should complete full user management flow', async () => {
    const bot = new TestBot();
    
    // Scenario: Admin changes user role
    
    // 1. Admin starts bot
    await bot.send('/start');
    
    // 2. Admin clicks users button
    await bot.clickButton('users:list');
    
    // 3. Admin searches for user
    await bot.clickButton('users:search');
    await bot.send('أحمد');
    
    // 4. Admin views user details
    await bot.clickButton('users:view:123');
    
    // 5. Admin changes role
    await bot.clickButton('users:role:123:MODERATOR');
    
    // 6. Admin confirms
    await bot.clickButton('users:role:123:MODERATOR:confirm');
    
    // Verify role changed successfully
    const lastMessage = bot.lastMessage();
    expect(lastMessage.text).toContain('✅ تم تحديث الدور');
  });
});
```

**Best Practices**:
1. Follow TDD methodology (RED → GREEN → REFACTOR)
2. Test all user stories
3. Test edge cases
4. Mock external dependencies
5. Use Testcontainers for integration tests

### Decision

Follow TDD methodology with comprehensive testing:
- Unit tests for all components
- Integration tests for all flows
- E2E tests for key scenarios
- Mock external dependencies
- Use Testcontainers for integration tests

### References

- Vitest Documentation: https://vitest.dev/
- Testcontainers Documentation: https://testcontainers.com/
- Constitution Rule XXXIV: TDD Mandatory
- Constitution Rule XXXVII: Test Naming Convention

---

## Research Summary

### Key Findings

1. **Inline Keyboard Best Practices**: 2-3 buttons per row, max 12 buttons, emoji icons, back navigation
2. **State Management**: Use session-manager for navigation state with 5-minute expiration
3. **User Search**: Use ILIKE with indexes, limit 10 results, cache results, debounce input
4. **Role Authorization**: Use CASL for role-based authorization
5. **Input Validation**: Use Zod for schema validation with Arabic error messages
6. **Error Handling**: Use Result pattern with clear Arabic error messages
7. **Testing Strategy**: TDD methodology with unit, integration, and E2E tests
8. **UX Helpers**: Use @tempot/ux-helpers for Inline Keyboards, status messages, confirmation dialogs
9. **Regional Engine**: Use @tempot/regional-engine for date/number formatting in Arabic
10. **Input Engine**: Use @tempot/input-engine for dynamic forms (profile editing)

### Decisions Made

1. Follow Telegram Inline Keyboard best practices
2. Use session-manager for navigation state
3. Use ILIKE with indexes for user search
4. Use CASL for role-based authorization
5. Use Zod for input validation
6. Use Result pattern for error handling
7. Follow TDD methodology with comprehensive testing
8. Use @tempot/ux-helpers for Inline Keyboards and status messages
9. Use @tempot/regional-engine for date/number formatting
10. Use @tempot/input-engine for dynamic forms

### No Further Research Required

All research topics resolved. No new technologies, no architectural decisions, no complex implementations. This is a straightforward user management module following existing infrastructure patterns.

---

## References

- Telegram Bot API: https://core.telegram.org/bots/api
- grammY Documentation: https://grammy.dev/
- CASL Documentation: https://casl.js.org/
- Zod Documentation: https://zod.dev/
- neverthrow Documentation: https://github.com/supermacro/neverthrow
- Vitest Documentation: https://vitest.dev/
- Testcontainers Documentation: https://testcontainers.com/
- ADR-016: Inline Keyboard Best Practices
- ADR-017: Search Implementation Strategy
- ADR-018: Input Validation Strategy
- Constitution Rules: XXI, XXVII, XXXIV, XXXVII, XXXVIII, XLV, XLVI
- @tempot/ux-helpers: Standardised Telegram UX components
- @tempot/regional-engine: Timezone, currency, number formatting
- @tempot/input-engine: Dynamic form engine built on grammY Conversations + Zod
- @tempot/auth-core: CASL-based authorization core
