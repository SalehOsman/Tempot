# User Management Module — Implementation Plan

**Feature:** 025-user-management
**Source:** spec.md (Approved)
**Generated:** 2026-04-26

---

## Technical Approach

This is a **user management module** that prioritizes **Inline Keyboard interactions** (90%) over command-based interactions (10%). The module provides intuitive profile management and user administration features.

### Architecture Impact

- **No architectural changes** - uses existing infrastructure
- **No new dependencies** - uses existing @tempot/* packages
- **No database schema changes** - uses existing users table
- **No API changes** - uses existing database repositories

### Tech Stack

- **No new dependencies**
- **Existing tools**: grammY, Vitest, Testcontainers
- **Existing packages**:
  - **Core**: session-manager, database, event-bus, i18n-core, shared
  - **Presentation**: ux-helpers, regional-engine, input-engine
  - **Authorization**: auth-core

---

## Implementation Strategy

### Phase 1: Module Scaffolding (Day 1)

**Directory Structure**:
```
apps/bot-server/modules/user-management/
  ├── module.config.ts
  ├── abilities.ts
  ├── locales/
  │   ├── ar.json
  │   └── en.json
  ├── commands/
  │   ├── start.command.ts
  │   ├── profile.command.ts
  │   ├── users.command.ts
  │   └── settings.command.ts
  ├── menus/
  │   ├── main-menu.factory.ts
  │   ├── profile-menu.factory.ts
  │   ├── users-menu.factory.ts
  │   └── settings-menu.factory.ts
  ├── handlers/
  │   ├── callback.handler.ts
  │   └── text.handler.ts
  ├── services/
  │   ├── user.service.ts
  │   ├── profile.service.ts
  │   └── role.service.ts
  ├── repositories/
  │   └── user.repository.ts
  ├── types/
  │   ├── user.types.ts
  │   ├── menu.types.ts
  │   └── navigation.types.ts
  └── tests/
      ├── unit/
      ├── integration/
      └── e2e/
```

**Files to Create**:
1. `module.config.ts` - Module configuration
2. `abilities.ts` - CASL abilities (GUEST, USER, MODERATOR, ADMIN, SUPER_ADMIN)
3. `locales/ar.json` - Arabic translations
4. `locales/en.json` - English translations
5. `commands/start.command.ts` - Start command handler
6. `commands/profile.command.ts` - Profile command shortcut
7. `commands/users.command.ts` - Users command shortcut
8. `menus/main-menu.factory.ts` - Main menu keyboard factory
9. `menus/profile-menu.factory.ts` - Profile menu keyboard factory
10. `menus/users-menu.factory.ts` - Users menu keyboard factory

---

### Phase 2: Menu System (Days 2-3)

#### 2.1: Main Menu Factory

**File**: `menus/main-menu.factory.ts`

**Responsibility**: Create main menu Inline Keyboard based on user role

**Implementation**:
```typescript
import { InlineKeyboard } from 'grammy';
import { UserProfile } from '../types/user.types';

export class MainMenuFactory {
  static create(user: UserProfile): InlineKeyboard {
    const keyboard = new InlineKeyboard();
    
    // Row 1: Quick Actions
    keyboard
      .text('👤 ملفي', 'profile:view')
      .text('⚙️ إعدادات', 'settings:view');
    
    // Row 2: Secondary Actions
    keyboard
      .text('🔔 إشعارات', 'notifications:view')
      .text('📨 رسائل', 'messages:view');
    
    // Row 3: Admin Actions (if admin)
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      keyboard
        .text('👥 مستخدمين', 'users:list')
        .text('📊 إحصائيات', 'stats:view');
    }
    
    // Row 4: Help
    keyboard.text('❓ مساعدة', 'help:view');
    
    return keyboard;
  }
}
```

**Best Practices**:
- 2-3 buttons per row for readability
- Max 12 buttons per keyboard
- Emoji icons for visual clarity
- Conditional buttons based on user role

---

#### 2.2: Profile Menu Factory

**File**: `menus/profile-menu.factory.ts`

**Responsibility**: Create profile-related Inline Keyboards

**Implementation**:
```typescript
export class ProfileMenuFactory {
  static createView(user: UserProfile): InlineKeyboard {
    const keyboard = new InlineKeyboard();
    
    keyboard
      .text('✏️ تعديل', 'profile:edit')
      .row()
      .text('📊 إحصائيات', 'profile:stats')
      .row()
      .text('🔙 العودة', 'menu:main');
    
    return keyboard;
  }
  
  static createEdit(): InlineKeyboard {
    const keyboard = new InlineKeyboard();
    
    keyboard
      .text('👤 الاسم', 'profile:edit:name')
      .text('📧 البريد', 'profile:edit:email')
      .row()
      .text('🌐 اللغة', 'profile:edit:language')
      .text('🎯 الدور', 'profile:edit:role')
      .row()
      .text('🔙 العودة', 'profile:view');
    
    return keyboard;
  }
  
  static createStats(user: UserProfile): InlineKeyboard {
    const keyboard = new InlineKeyboard();
    
    const message = `
📊 إحصائياتك

📨 الرسائل: ${user.messageCount || 0}
✅ المهام المكتملة: ${user.completedTasks || 0}
⏱️ الوقت النشط: ${user.activeTime || '0 ساعة'}
🌟 التقييم: ${user.rating || 'N/A'}
`;
    
    keyboard.text('🔙 العودة', 'profile:view');
    
    return keyboard;
  }
}
```

---

#### 2.3: Users Menu Factory

**File**: `menus/users-menu.factory.ts`

**Responsibility**: Create user management Inline Keyboards

**Implementation**:
```typescript
export class UsersMenuFactory {
  static createList(): InlineKeyboard {
    const keyboard = new InlineKeyboard();
    
    keyboard
      .text('🔍 بحث', 'users:search')
      .text('📋 القائمة', 'users:list')
      .row()
      .text('🔙 العودة', 'menu:main');
    
    return keyboard;
  }
  
  static createSearchResults(users: UserProfile[]): InlineKeyboard {
    const keyboard = new InlineKeyboard();
    
    users.forEach((user, index) => {
      keyboard
        .text(`👤 ${user.username || user.telegramId}`, `users:view:${user.id}`);
      
      if (index % 2 === 1) {
        keyboard.row();
      }
    });
    
    keyboard.row().text('🔙 العودة', 'users:list');
    
    return keyboard;
  }
  
  static createRoleChange(user: UserProfile): InlineKeyboard {
    const keyboard = new InlineKeyboard();
    
    keyboard
      .text('👤 مستخدم', `users:role:${user.id}:USER`)
      .text('👨‍💼 مشرف', `users:role:${user.id}:MODERATOR`)
      .row()
      .text('👨‍💻 مدير', `users:role:${user.id}:ADMIN`)
      .text('👑 مدير عام', `users:role:${user.id}:SUPER_ADMIN`)
      .row()
      .text('🔙 العودة', `users:view:${user.id}`);
    
    return keyboard;
  }
  
  static createConfirm(action: string): InlineKeyboard {
    const keyboard = new InlineKeyboard();
    
    keyboard
      .text('✅ نعم', `${action}:confirm`)
      .text('❌ لا', `${action}:cancel`);
    
    return keyboard;
  }
}
```

---

### Phase 3: Command Handlers (Days 4-5)

#### 3.1: Start Command

**File**: `commands/start.command.ts`

**Responsibility**: Display main menu via Inline Keyboard

**Implementation**:
```typescript
import { Context } from 'grammy';
import { MainMenuFactory } from '../menus/main-menu.factory';
import { UserService } from '../services/user.service';

export async function startCommand(ctx: Context) {
  const telegramId = ctx.from?.id.toString();
  if (!telegramId) {
    return ctx.reply('❌ خطأ: غير قادر على تحديد المستخدم');
  }
  
  const userResult = await UserService.getByTelegramId(telegramId);
  if (userResult.isErr()) {
    return ctx.reply('❌ خطأ في جلب بيانات المستخدم');
  }
  
  const user = userResult.value;
  const keyboard = MainMenuFactory.create(user);
  
  const message = `
👋 مرحباً بك في Tempot

👤 ${user.username || user.telegramId}
🎯 دور: ${user.role}
📊 المهام المكتملة: ${user.completedTasks || 0}
`;
  
  await ctx.reply(message, { reply_markup: keyboard });
}
```

---

#### 3.2: Profile Command

**File**: `commands/profile.command.ts`

**Responsibility**: Shortcut to profile view (same as clicking "👤 ملفي" button)

**Implementation**:
```typescript
import { Context } from 'grammy';
import { ProfileMenuFactory } from '../menus/profile-menu.factory';
import { UserService } from '../services/user.service';

export async function profileCommand(ctx: Context) {
  const telegramId = ctx.from?.id.toString();
  if (!telegramId) return;
  
  const userResult = await UserService.getByTelegramId(telegramId);
  if (userResult.isErr()) return;
  
  const user = userResult.value;
  const keyboard = ProfileMenuFactory.createView(user);
  
  const message = `
👤 ملفك الشخصي

👤 ${user.username || 'غير محدد'}
📧 ${user.email || 'غير محدد'}
🌐 ${user.language}
🎯 ${user.role}
📅 انضم: ${user.createdAt.toLocaleDateString('ar-EG')}
`;
  
  await ctx.reply(message, { reply_markup: keyboard });
}
```

---

#### 3.3: Users Command

**File**: `commands/users.command.ts`

**Responsibility**: Shortcut to users management menu (admin only)

**Implementation**:
```typescript
import { Context } from 'grammy';
import { UsersMenuFactory } from '../menus/users-menu.factory';
import { UserService } from '../services/user.service';
import { AuthService } from '@tempot/auth-core';

export async function usersCommand(ctx: Context) {
  const telegramId = ctx.from?.id.toString();
  if (!telegramId) return;
  
  // Check authorization
  const authResult = await AuthService.checkPermission(telegramId, 'users:manage');
  if (authResult.isErr()) {
    return ctx.reply('⚠️ ليس لديك صلاحية للوصول إلى هذه الميزة');
  }
  
  const keyboard = UsersMenuFactory.createList();
  
  const message = `
👥 إدارة المستخدمين

اختر إجراء:
`;
  
  await ctx.reply(message, { reply_markup: keyboard });
}
```

---

### Phase 4: Callback Query Handlers (Days 6-7)

#### 4.1: Callback Handler

**File**: `handlers/callback.handler.ts`

**Responsibility**: Handle all Inline Keyboard button clicks

**Implementation**:
```typescript
import { Context } from 'grammy';
import { ProfileMenuFactory } from '../menus/profile-menu.factory';
import { UsersMenuFactory } from '../menus/users-menu.factory';
import { MainMenuFactory } from '../menus/main-menu.factory';
import { UserService } from '../services/user.service';
import { RoleService } from '../services/role.service';

export async function handleCallbackQuery(ctx: Context) {
  const callbackData = ctx.callbackQuery?.data;
  if (!callbackData) return;
  
  const [action, ...params] = callbackData.split(':');
  
  switch (action) {
    case 'profile':
      await handleProfileAction(ctx, params);
      break;
    case 'users':
      await handleUsersAction(ctx, params);
      break;
    case 'menu':
      await handleMenuAction(ctx, params);
      break;
    case 'settings':
      await handleSettingsAction(ctx, params);
      break;
    default:
      await ctx.answerCallbackQuery('❌ إجراء غير معروف');
  }
}

async function handleProfileAction(ctx: Context, params: string[]) {
  const telegramId = ctx.from?.id.toString();
  if (!telegramId) return;
  
  const userResult = await UserService.getByTelegramId(telegramId);
  if (userResult.isErr()) return;
  
  const user = userResult.value;
  
  switch (params[0]) {
    case 'view':
      const viewKeyboard = ProfileMenuFactory.createView(user);
      await ctx.editMessageText('👤 ملفك الشخصي', { reply_markup: viewKeyboard });
      break;
    case 'edit':
      const editKeyboard = ProfileMenuFactory.createEdit();
      await ctx.editMessageText('✏️ تعديل الملف الشخصي', { reply_markup: editKeyboard });
      break;
    case 'edit:name':
      await handleEditName(ctx, user);
      break;
    case 'edit:email':
      await handleEditEmail(ctx, user);
      break;
    case 'edit:language':
      await handleEditLanguage(ctx, user);
      break;
    case 'stats':
      const statsKeyboard = ProfileMenuFactory.createStats(user);
      const statsMessage = `
📊 إحصائياتك

📨 الرسائل: ${user.messageCount || 0}
✅ المهام المكتملة: ${user.completedTasks || 0}
⏱️ الوقت النشط: ${user.activeTime || '0 ساعة'}
🌟 التقييم: ${user.rating || 'N/A'}
`;
      await ctx.editMessageText(statsMessage, { reply_markup: statsKeyboard });
      break;
    default:
      await ctx.answerCallbackQuery('❌ إجراء غير معروف');
  }
}

async function handleUsersAction(ctx: Context, params: string[]) {
  const telegramId = ctx.from?.id.toString();
  if (!telegramId) return;
  
  // Check authorization
  const authResult = await AuthService.checkPermission(telegramId, 'users:manage');
  if (authResult.isErr()) {
    return ctx.answerCallbackQuery('⚠️ ليس لديك صلاحية');
  }
  
  switch (params[0]) {
    case 'list':
      const listKeyboard = UsersMenuFactory.createList();
      await ctx.editMessageText('👥 إدارة المستخدمين', { reply_markup: listKeyboard });
      break;
    case 'search':
      await handleUserSearch(ctx);
      break;
    case 'view':
      await handleUserView(ctx, params[1]);
      break;
    case 'role':
      await handleRoleChange(ctx, params[1], params[2]);
      break;
    default:
      await ctx.answerCallbackQuery('❌ إجراء غير معروف');
  }
}

async function handleMenuAction(ctx: Context, params: string[]) {
  const telegramId = ctx.from?.id.toString();
  if (!telegramId) return;
  
  const userResult = await UserService.getByTelegramId(telegramId);
  if (userResult.isErr()) return;
  
  const user = userResult.value;
  const keyboard = MainMenuFactory.create(user);
  
  const message = `
👋 مرحباً بك في Tempot

👤 ${user.username || user.telegramId}
🎯 دور: ${user.role}
📊 المهام المكتملة: ${user.completedTasks || 0}
`;
  
  await ctx.editMessageText(message, { reply_markup: keyboard });
}

async function handleEditName(ctx: Context, user: UserProfile) {
  // Store navigation state in session
  await ctx.session.set('navigation', {
    action: 'profile:edit:name',
    userId: user.id
  });
  
  const keyboard = new InlineKeyboard()
    .text('🔙 العودة', 'profile:view');
  
  await ctx.editMessageText('👤 تعديل الاسم\n\nالاسم الحالي: ' + (user.username || 'غير محدد') + '\n\nأدخل الاسم الجديد:', { reply_markup: keyboard });
}

async function handleUserSearch(ctx: Context) {
  // Store navigation state in session
  await ctx.session.set('navigation', {
    action: 'users:search'
  });
  
  const keyboard = new InlineKeyboard()
    .text('🔙 العودة', 'users:list');
  
  await ctx.editMessageText('🔍 البحث عن مستخدم\n\nأدخل اسم المستخدم أو الـ ID:', { reply_markup: keyboard });
}

async function handleUserView(ctx: Context, userId: string) {
  const userResult = await UserService.getById(userId);
  if (userResult.isErr()) {
    return ctx.answerCallbackQuery('❌ خطأ في جلب بيانات المستخدم');
  }
  
  const user = userResult.value;
  
  const keyboard = new InlineKeyboard()
    .text('🎯 تعديل الدور', `users:role:${user.id}`)
    .row()
    .text('🔙 العودة', 'users:list');
  
  const message = `
👤 تفاصيل المستخدم

👤 ${user.username || 'غير محدد'}
📧 ${user.email || 'غير محدد'}
🌐 ${user.language}
🎯 دور: ${user.role}
📅 انضم: ${user.createdAt.toLocaleDateString('ar-EG')}
📊 المهام المكتملة: ${user.completedTasks || 0}
`;
  
  await ctx.editMessageText(message, { reply_markup: keyboard });
}

async function handleRoleChange(ctx: Context, userId: string, newRole: string) {
  // Store pending role change in session
  await ctx.session.set('pendingRoleChange', {
    userId,
    newRole
  });
  
  const keyboard = new InlineKeyboard()
    .text('✅ نعم', `users:role:${userId}:${newRole}:confirm`)
    .text('❌ لا', `users:role:${userId}:${newRole}:cancel`);
  
  await ctx.editMessageText(`⚠️ تأكيد تغيير الدور\n\nهل تريد تغيير دور المستخدم إلى "${newRole}"؟`, { reply_markup: keyboard });
}
```

---

#### 4.2: Text Handler

**File**: `handlers/text.handler.ts`

**Responsibility**: Handle text input for form fields

**Implementation**:
```typescript
import { Context } from 'grammy';
import { UserService } from '../services/user.service';
import { ProfileMenuFactory } from '../menus/profile-menu.factory';
import { UsersMenuFactory } from '../menus/users-menu.factory';

export async function handleTextInput(ctx: Context) {
  const text = ctx.message?.text;
  if (!text) return;
  
  const navigation = await ctx.session.get('navigation');
  if (!navigation) return;
  
  switch (navigation.action) {
    case 'profile:edit:name':
      await handleNameUpdate(ctx, text, navigation.userId);
      break;
    case 'profile:edit:email':
      await handleEmailUpdate(ctx, text, navigation.userId);
      break;
    case 'users:search':
      await handleUserSearchQuery(ctx, text);
      break;
    default:
      await ctx.reply('❌ إجراء غير معروف');
  }
}

async function handleNameUpdate(ctx: Context, newName: string, userId: string) {
  // Validate input
  if (newName.trim().length === 0) {
    return ctx.reply('⚠️ الاسم لا يمكن أن يكون فارغاً');
  }
  
  if (newName.length > 50) {
    return ctx.reply('⚠️ الاسم طويل جداً (حد أقصى 50 حرف)');
  }
  
  // Update user
  const updateResult = await UserService.updateUsername(userId, newName.trim());
  if (updateResult.isErr()) {
    return ctx.reply('❌ خطأ في تحديث الاسم');
  }
  
  // Clear navigation state
  await ctx.session.set('navigation', null);
  
  // Show updated profile
  const userResult = await UserService.getById(userId);
  if (userResult.isErr()) return;
  
  const user = userResult.value;
  const keyboard = ProfileMenuFactory.createView(user);
  
  const message = `
✅ تم تحديث الاسم بنجاح!

👤 ملفك الشخصي

👤 ${user.username || 'غير محدد'}
📧 ${user.email || 'غير محدد'}
🌐 ${user.language}
🎯 ${user.role}
`;
  
  await ctx.reply(message, { reply_markup: keyboard });
}

async function handleUserSearchQuery(ctx: Context, query: string) {
  // Search users
  const searchResult = await UserService.searchUsers(query);
  if (searchResult.isErr()) {
    return ctx.reply('❌ خطأ في البحث');
  }
  
  const users = searchResult.value;
  
  if (users.length === 0) {
    const keyboard = new InlineKeyboard()
      .text('🔙 العودة', 'users:list');
    
    return ctx.reply('❌ لم يتم العثور على مستخدمين', { reply_markup: keyboard });
  }
  
  // Show results
  const keyboard = UsersMenuFactory.createSearchResults(users);
  
  const message = `
🔍 نتائج البحث: "${query}"

تم العثور على ${users.length} مستخدم(ين):
`;
  
  await ctx.reply(message, { reply_markup: keyboard });
  
  // Clear navigation state
  await ctx.session.set('navigation', null);
}
```

---

### Phase 5: Services (Days 8-9)

#### 5.1: User Service

**File**: `services/user.service.ts`

**Responsibility**: Business logic for user operations

**Implementation**:
```typescript
import { Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { UserRepository } from '../repositories/user.repository';
import { UserProfile, UserRole } from '../types/user.types';

export class UserService {
  private static cache = new Map<string, { user: UserProfile; expiresAt: number }>();
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  
  static async getByTelegramId(telegramId: string): Promise<Result<UserProfile, AppError>> {
    // Check cache
    const cached = this.cache.get(telegramId);
    if (cached && cached.expiresAt > Date.now()) {
      return Result.ok(cached.user);
    }
    
    // Fetch from database
    const result = await UserRepository.findByTelegramId(telegramId);
    if (result.isErr()) {
      return result;
    }
    
    const user = result.value;
    
    // Update cache
    this.cache.set(telegramId, {
      user,
      expiresAt: Date.now() + this.CACHE_TTL
    });
    
    return Result.ok(user);
  }
  
  static async getById(userId: string): Promise<Result<UserProfile, AppError>> {
    const result = await UserRepository.findById(userId);
    if (result.isErr()) {
      return result;
    }
    
    const user = result.value;
    
    // Update cache
    this.cache.set(user.telegramId, {
      user,
      expiresAt: Date.now() + this.CACHE_TTL
    });
    
    return Result.ok(user);
  }
  
  static async updateUsername(userId: string, newUsername: string): Promise<Result<void, AppError>> {
    const result = await UserRepository.updateUsername(userId, newUsername);
    if (result.isErr()) {
      return result;
    }
    
    // Invalidate cache
    const userResult = await this.getById(userId);
    if (userResult.isOk()) {
      this.cache.delete(userResult.value.telegramId);
    }
    
    // Publish event
    // await EventBus.publish('user-management.user.updated', { userId, field: 'username', value: newUsername });
    
    return Result.ok(undefined);
  }
  
  static async updateEmail(userId: string, newEmail: string): Promise<Result<void, AppError>> {
    const result = await UserRepository.updateEmail(userId, newEmail);
    if (result.isErr()) {
      return result;
    }
    
    // Invalidate cache
    const userResult = await this.getById(userId);
    if (userResult.isOk()) {
      this.cache.delete(userResult.value.telegramId);
    }
    
    return Result.ok(undefined);
  }
  
  static async updateLanguage(userId: string, newLanguage: string): Promise<Result<void, AppError>> {
    const result = await UserRepository.updateLanguage(userId, newLanguage);
    if (result.isErr()) {
      return result;
    }
    
    // Invalidate cache
    const userResult = await this.getById(userId);
    if (userResult.isOk()) {
      this.cache.delete(userResult.value.telegramId);
    }
    
    return Result.ok(undefined);
  }
  
  static async searchUsers(query: string): Promise<Result<UserProfile[], AppError>> {
    return UserRepository.search(query);
  }
}
```

---

#### 5.2: Role Service

**File**: `services/role.service.ts`

**Responsibility**: Business logic for role management

**Implementation**:
```typescript
import { Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { UserRepository } from '../repositories/user.repository';
import { UserRole } from '../types/user.types';

export class RoleService {
  static async changeRole(userId: string, newRole: UserRole): Promise<Result<void, AppError>> {
    // Validate role
    if (!Object.values(UserRole).includes(newRole)) {
      return Result.err(new AppError('invalid_role', 'Invalid role'));
    }
    
    // Get user
    const userResult = await UserRepository.findById(userId);
    if (userResult.isErr()) {
      return userResult;
    }
    
    const user = userResult.value;
    
    // Check if role is already the same
    if (user.role === newRole) {
      return Result.ok(undefined);
    }
    
    // Update role
    const updateResult = await UserRepository.updateRole(userId, newRole);
    if (updateResult.isErr()) {
      return updateResult;
    }
    
    // Invalidate cache
    // await UserService.invalidateCache(user.telegramId);
    
    // Publish event
    // await EventBus.publish('user-management.role.changed', { userId, oldRole: user.role, newRole });
    
    return Result.ok(undefined);
  }
}
```

---

### Phase 6: Testing (Days 10-12)

#### 6.1: Unit Tests

**File**: `tests/unit/menus/main-menu.factory.test.ts`

**Implementation**:
```typescript
import { describe, it, expect } from 'vitest';
import { MainMenuFactory } from '../../menus/main-menu.factory';
import { UserProfile, UserRole } from '../../types/user.types';

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
    
    // Verify no admin buttons
    const hasAdminButton = keyboard.inline_keyboard.some(row =>
      row.some(button => button.callback_data?.includes('users:list'))
    );
    
    expect(hasAdminButton).toBe(false);
  });
  
  it('should include admin buttons for admin users', () => {
    const user: UserProfile = {
      id: '1',
      telegramId: '123456789',
      role: UserRole.ADMIN,
      language: 'ar',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const keyboard = MainMenuFactory.create(user);
    
    const hasAdminButton = keyboard.inline_keyboard.some(row =>
      row.some(button => button.callback_data?.includes('users:list'))
    );
    
    expect(hasAdminButton).toBe(true);
  });
  
  it('should have 2-3 buttons per row', () => {
    const user: UserProfile = {
      id: '1',
      telegramId: '123456789',
      role: UserRole.USER,
      language: 'ar',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const keyboard = MainMenuFactory.create(user);
    
    keyboard.inline_keyboard.forEach(row => {
      expect(row.length).toBeGreaterThanOrEqual(1);
      expect(row.length).toBeLessThanOrEqual(3);
    });
  });
  
  it('should have max 12 buttons', () => {
    const user: UserProfile = {
      id: '1',
      telegramId: '123456789',
      role: UserRole.SUPER_ADMIN,
      language: 'ar',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const keyboard = MainMenuFactory.create(user);
    
    const totalButtons = keyboard.inline_keyboard.reduce((sum, row) => sum + row.length, 0);
    expect(totalButtons).toBeLessThanOrEqual(12);
  });
});
```

---

#### 6.2: Integration Tests

**File**: `tests/integration/profile-flow.test.ts`

**Implementation**:
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createMockBot } from '@tempot/bot-server/test-utils';
import { UserManagementModule } from '../../index';

describe('Profile Flow Integration Tests', () => {
  let bot: any;
  
  beforeEach(() => {
    bot = createMockBot();
    new UserManagementModule(bot);
  });
  
  afterEach(() => {
    bot.clear();
  });
  
  it('should complete profile edit flow', async () => {
    // Step 1: User sends /start
    await bot.handleUpdate({ message: { text: '/start', from: { id: 123456789 } } });
    
    // Verify main menu is shown
    const mainMenu = bot.lastMessage();
    expect(mainMenu.reply_markup).toBeDefined();
    expect(mainMenu.reply_markup.inline_keyboard).toBeDefined();
    
    // Step 2: User clicks profile button
    await bot.handleUpdate({ callback_query: { data: 'profile:view', from: { id: 123456789 } } });
    
    // Verify profile view is shown
    const profileView = bot.lastMessage();
    expect(profileView.text).toContain('👤 ملفك الشخصي');
    
    // Step 3: User clicks edit button
    await bot.handleUpdate({ callback_query: { data: 'profile:edit', from: { id: 123456789 } } });
    
    // Verify edit options are shown
    const editOptions = bot.lastMessage();
    expect(editOptions.text).toContain('✏️ تعديل الملف الشخصي');
    
    // Step 4: User clicks name button
    await bot.handleUpdate({ callback_query: { data: 'profile:edit:name', from: { id: 123456789 } } });
    
    // Verify name edit prompt is shown
    const namePrompt = bot.lastMessage();
    expect(namePrompt.text).toContain('تعديل الاسم');
    
    // Step 5: User enters new name
    await bot.handleUpdate({ message: { text: 'أحمد محمد', from: { id: 123456789 } } });
    
    // Verify success message
    const successMessage = bot.lastMessage();
    expect(successMessage.text).toContain('✅ تم تحديث الاسم بنجاح');
  });
});
```

---

#### 6.3: E2E Tests

**File**: `tests/e2e/user-management.e2e.test.ts`

**Implementation**:
```typescript
import { describe, it, expect } from 'vitest';
import { TestBot } from '@tempot/bot-server/test-utils';

describe('User Management E2E Tests', () => {
  it('should complete full user management flow', async () => {
    const bot = new TestBot();
    
    // Scenario: Admin changes user role
    
    // 1. Admin starts bot
    await bot.send('/start');
    const mainMenu = bot.lastMessage();
    expect(mainMenu.text).toContain('👋 مرحباً بك');
    
    // 2. Admin clicks users button
    await bot.clickButton('users:list');
    const usersMenu = bot.lastMessage();
    expect(usersMenu.text).toContain('👥 إدارة المستخدمين');
    
    // 3. Admin searches for user
    await bot.clickButton('users:search');
    await bot.send('أحمد');
    const searchResults = bot.lastMessage();
    expect(searchResults.text).toContain('أحمد');
    
    // 4. Admin views user details
    await bot.clickButton('users:view:123');
    const userDetails = bot.lastMessage();
    expect(userDetails.text).toContain('أحمد محمد');
    
    // 5. Admin changes role
    await bot.clickButton('users:role:123:MODERATOR');
    const confirmMessage = bot.lastMessage();
    expect(confirmMessage.text).toContain('تأكيد تغيير الدور');
    
    // 6. Admin confirms
    await bot.clickButton('users:role:123:MODERATOR:confirm');
    const successMessage = bot.lastMessage();
    expect(successMessage.text).toContain('✅ تم تحديث الدور');
  });
});
```

---

### Phase 7: Documentation (Days 13-14)

#### 7.1: Module README

**File**: `apps/bot-server/modules/user-management/README.md`

**Content**:
```markdown
# User Management Module

> إدارة المستخدمين والملفات الشخصية

## Purpose

إدارة المستخدمين والملفات الشخصية عبر واجهة سهلة تعتمد على الأزرار.

## Features

- ✅ عرض الملف الشخصي
- ✅ تعديل الملف الشخصي
- ✅ إدارة المستخدمين (للمسؤولين)
- ✅ تغيير الأدوار (للمسؤولين)
- ✅ البحث عن المستخدمين (للمسؤولين)

## UI/UX

- **Primary**: Inline Keyboards (90%)
- **Secondary**: Commands (10%)
- **Navigation**: Hierarchical menu system with back buttons

## Commands

| Command | Description | Access |
|---------|-------------|--------|
| `/start` | عرض القائمة الرئيسية | All |
| `/profile` | اختصار للملف الشخصي | All |
| `/users` | اختصار لإدارة المستخدمين | Admin+ |

## Dependencies

| Package | Purpose |
|---------|---------|
| @tempot/session-manager | Session management |
| @tempot/database | User repository |
| @tempot/event-bus | Event publishing |
| @tempot/i18n-core | Translations |
| @tempot/shared | Result pattern, AppError |

## Status

✅ **Implemented** — Phase 1
```

---

#### 7.2: Update ROADMAP.md

**Add to ROADMAP.md**:
```markdown
| — | user-management | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ Complete |
```

---

#### 7.3: Update CHANGELOG.md

**Add to CHANGELOG.md**:
```markdown
## [Unreleased]

### Added

- **User Management Module** — Profile management and user administration via Inline Keyboards
  - Profile view and edit via buttons
  - User search and management for admins
  - Role management for admins
  - Navigation system with back buttons
  - Command shortcuts for power users

Fixes: None
```

---

## Risk Assessment

### Low Risk 🟢

- **No architectural changes** - uses existing infrastructure
- **No database schema changes** - uses existing users table
- **Reversible changes** - can be rolled back if issues arise
- **Well-tested** - comprehensive unit, integration, and E2E tests

### Mitigation Strategies

1. **Incremental Implementation**: Implement one feature at a time
2. **Comprehensive Testing**: Test each feature thoroughly before moving to next
3. **Code Review**: Manual review of all changes
4. **Rollback Plan**: Git revert if issues arise

---

## Success Metrics

1. ✅ 90% of interactions via Inline Keyboards
2. ✅ 10% of interactions via commands
3. ✅ All user stories acceptance criteria met
4. ✅ All edge cases handled gracefully
5. ✅ Unit tests: > 80% coverage
6. ✅ Integration tests: All flows tested
7. ✅ E2E tests: Key scenarios tested
8. ✅ `pnpm spec:validate` passes
9. ✅ All existing tests pass
10. ✅ No lint errors
11. ✅ No TypeScript errors

---

## Timeline Estimate

- **Phase 1**: 1 day (Module Scaffolding)
- **Phase 2**: 2 days (Menu System)
- **Phase 3**: 2 days (Command Handlers)
- **Phase 4**: 2 days (Callback Query Handlers)
- **Phase 5**: 2 days (Services)
- **Phase 6**: 3 days (Testing)
- **Phase 7**: 2 days (Documentation)

**Total**: 14 days (2 weeks)

---

## Next Steps

1. ✅ Create branch `feature/025-user-management`
2. ✅ Create SpecKit artifacts (spec.md, plan.md, tasks.md, data-model.md, research.md)
3. Implement module structure
4. Implement Menu System
5. Implement Command Handlers
6. Implement Callback Query Handlers
7. Implement Services
8. Implement Testing
9. Implement Documentation
10. Merge to main
