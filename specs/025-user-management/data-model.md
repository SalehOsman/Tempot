# User Management Module — Data Model

**Feature:** 025-user-management
**Source:** spec.md + plan.md
**Generated:** 2026-04-26

---

## Overview

This feature involves **minimal database schema changes** and focuses on **API contracts** and **data structures** for user management functionality. The module uses the existing `users` table and adds new API contracts for Inline Keyboard interactions.

---

## Database Schema

### Existing Schema (No Changes Required)

The module uses the existing `users` table from `@tempot/database`:

```sql
-- Existing table (no changes required)
CREATE TABLE users (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  telegram_id BIGINT UNIQUE NOT NULL,
  username VARCHAR(255),
  email VARCHAR(255),
  language VARCHAR(10) DEFAULT 'ar',
  role VARCHAR(20) DEFAULT 'USER',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes (already exist)
CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
```

### No New Tables Required

This module does not require any new database tables. All user data is stored in the existing `users` table.

---

## API Contracts

### UserProfile Interface

**Location**: `apps/bot-server/modules/user-management/types/user.types.ts`

```typescript
export interface UserProfile {
  id: string;
  telegramId: string;
  username?: string;
  email?: string;
  language: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  
  // Optional fields for display
  messageCount?: number;
  completedTasks?: number;
  activeTime?: string;
  rating?: string;
}
```

**Purpose**: Represents a user profile with all relevant information for display and management.

**Validation**:
- `id`: Required, string format
- `telegramId`: Required, string format
- `username`: Optional, max 255 characters
- `email`: Optional, valid email format
- `language`: Required, ISO 639-1 code (2 characters)
- `role`: Required, valid UserRole enum value
- `createdAt`: Required, Date object
- `updatedAt`: Required, Date object

---

### UserRole Enum

**Location**: `apps/bot-server/modules/user-management/types/user.types.ts`

```typescript
export enum UserRole {
  GUEST = 'GUEST',
  USER = 'USER',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN'
}
```

**Purpose**: Defines user roles for access control.

**Values**:
- `GUEST`: Guest user (limited access)
- `USER`: Regular user (full access to personal features)
- `MODERATOR`: Moderator (can manage users, view reports)
- `ADMIN`: Administrator (full access to all features)
- `SUPER_ADMIN`: Super Administrator (full access + system settings)

---

### MenuAction Type

**Location**: `apps/bot-server/modules/user-management/types/menu.types.ts`

```typescript
export type MenuAction =
  // Profile actions
  | 'profile:view'
  | 'profile:edit'
  | 'profile:edit:name'
  | 'profile:edit:email'
  | 'profile:edit:language'
  | 'profile:stats'
  
  // Users actions
  | 'users:list'
  | 'users:search'
  | 'users:view'
  | 'users:role'
  | 'users:role:confirm'
  | 'users:role:cancel'
  
  // Menu actions
  | 'menu:main'
  
  // Settings actions
  | 'settings:view'
  
  // Notifications actions
  | 'notifications:view'
  
  // Messages actions
  | 'messages:view'
  
  // Stats actions
  | 'stats:view'
  
  // Help actions
  | 'help:view';
```

**Purpose**: Defines all possible Inline Keyboard button actions.

**Format**: `category:action[:parameter]`

---

### NavigationState Type

**Location**: `apps/bot-server/modules/user-management/types/navigation.types.ts`

```typescript
export interface NavigationState {
  action: string;
  userId?: string;
  pendingRoleChange?: {
    userId: string;
    newRole: UserRole;
  };
  timestamp: number;
}
```

**Purpose**: Stores navigation state in session for tracking user's current screen and pending actions.

**Fields**:
- `action`: Current action/screen
- `userId`: User ID (for admin actions)
- `pendingRoleChange`: Pending role change (for confirmation)
- `timestamp`: Timestamp for state expiration

---

## Data Structures

### Inline Keyboard Structure

**Location**: `apps/bot-server/modules/user-management/menus/*.factory.ts`

```typescript
interface InlineKeyboardButton {
  text: string;
  callback_data?: string;
  url?: string;
}

interface InlineKeyboardRow {
  buttons: InlineKeyboardButton[];
}

interface InlineKeyboard {
  inline_keyboard: InlineKeyboardRow[];
}
```

**Purpose**: Defines the structure of Inline Keyboards used throughout the module.

**Constraints**:
- 2-3 buttons per row for readability
- Max 12 buttons per keyboard
- Emoji icons required for visual clarity

---

### UserSearchResult Structure

**Location**: `apps/bot-server/modules/user-management/services/user.service.ts`

```typescript
interface UserSearchResult {
  users: UserProfile[];
  totalCount: number;
  page: number;
  pageSize: number;
}
```

**Purpose**: Defines the structure of user search results with pagination.

**Fields**:
- `users`: Array of user profiles
- `totalCount`: Total number of matching users
- `page`: Current page number
- `pageSize`: Number of users per page (default: 10)

---

### RoleChangeRequest Structure

**Location**: `apps/bot-server/modules/user-management/services/role.service.ts`

```typescript
interface RoleChangeRequest {
  userId: string;
  newRole: UserRole;
  requestedBy: string; // Telegram ID of admin requesting the change
  timestamp: Date;
}
```

**Purpose**: Defines the structure of a role change request.

**Fields**:
- `userId`: User ID to change role
- `newRole`: New role to assign
- `requestedBy`: Telegram ID of admin requesting the change
- `timestamp`: Timestamp of request

---

## Data Flow

### Profile View Flow

```
User clicks "👤 ملفي" button
  ↓
Callback: 'profile:view'
  ↓
UserService.getByTelegramId(telegramId)
  ↓
Database Query: SELECT * FROM users WHERE telegram_id = ?
  ↓
Cache Check: Check cache for user data
  ↓
ProfileMenuFactory.createView(user)
  ↓
Inline Keyboard: View profile buttons
  ↓
Display: Profile view with Inline Keyboard
```

---

### Profile Edit Flow

```
User clicks "✏️ تعديل" button
  ↓
Callback: 'profile:edit'
  ↓
ProfileMenuFactory.createEdit()
  ↓
Inline Keyboard: Edit options buttons
  ↓
Display: Edit options with Inline Keyboard
  ↓
User clicks "👤 الاسم" button
  ↓
Callback: 'profile:edit:name'
  ↓
Store NavigationState: { action: 'profile:edit:name', userId }
  ↓
Display: Name edit prompt with Inline Keyboard
  ↓
User enters new name
  ↓
Text Handler: handleTextInput()
  ↓
Validate Input: Check name length and format
  ↓
UserService.updateUsername(userId, newName)
  ↓
Database Update: UPDATE users SET username = ?, updated_at = NOW() WHERE id = ?
  ↓
Cache Invalidation: Remove user from cache
  ↓
Event Publishing: Publish 'user-management.user.updated' event
  ↓
Display: Success message with Inline Keyboard
```

---

### User Search Flow

```
Admin clicks "👥 مستخدمين" button
  ↓
Callback: 'users:list'
  ↓
Authorization Check: Check if user has 'users:manage' permission
  ↓
UsersMenuFactory.createList()
  ↓
Inline Keyboard: Users list buttons
  ↓
Display: Users list with Inline Keyboard
  ↓
Admin clicks "🔍 بحث" button
  ↓
Callback: 'users:search'
  ↓
Store NavigationState: { action: 'users:search' }
  ↓
Display: Search prompt with Inline Keyboard
  ↓
Admin enters search query
  ↓
Text Handler: handleTextInput()
  ↓
UserService.searchUsers(query)
  ↓
Database Query: SELECT * FROM users WHERE username LIKE ? OR email LIKE ? LIMIT 10
  ↓
UsersMenuFactory.createSearchResults(users)
  ↓
Inline Keyboard: Search results buttons
  ↓
Display: Search results with Inline Keyboard
```

---

### Role Change Flow

```
Admin clicks user button
  ↓
Callback: 'users:view:userId'
  ↓
UserService.getById(userId)
  ↓
Database Query: SELECT * FROM users WHERE id = ?
  ↓
Display: User details with Inline Keyboard
  ↓
Admin clicks "🎯 تعديل الدور" button
  ↓
Callback: 'users:role:userId'
  ↓
UsersMenuFactory.createRoleChange(user)
  ↓
Inline Keyboard: Role options buttons
  ↓
Display: Role options with Inline Keyboard
  ↓
Admin clicks role button (e.g., "👨‍💼 مشرف")
  ↓
Callback: 'users:role:userId:MODERATOR'
  ↓
Store PendingRoleChange: { userId, newRole: 'MODERATOR' }
  ↓
UsersMenuFactory.createConfirm('users:role:userId:MODERATOR')
  ↓
Inline Keyboard: Confirm buttons
  ↓
Display: Confirmation dialog with Inline Keyboard
  ↓
Admin clicks "✅ نعم" button
  ↓
Callback: 'users:role:userId:MODERATOR:confirm'
  ↓
RoleService.changeRole(userId, 'MODERATOR')
  ↓
Validate Role: Check if role is valid
  ↓
Database Update: UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?
  ↓
Cache Invalidation: Remove user from cache
  ↓
Event Publishing: Publish 'user-management.role.changed' event
  ↓
Display: Success message with Inline Keyboard
```

---

## Validation Schemas

### Username Validation

**Location**: `apps/bot-server/modules/user-management/handlers/text.handler.ts`

```typescript
import { z } from 'zod';

export const usernameSchema = z.string()
  .min(1, 'الاسم لا يمكن أن يكون فارغاً')
  .max(50, 'الاسم طويل جداً (حد أقصى 50 حرف)')
  .regex(/^[a-zA-Z\u0600-\u06FF\s]+$/, 'الاسم يحتوي على أحرف غير صالحة');
```

**Validation Rules**:
- Minimum length: 1 character
- Maximum length: 50 characters
- Allowed characters: Letters (Arabic and English) and spaces

---

### Email Validation

**Location**: `apps/bot-server/modules/user-management/handlers/text.handler.ts`

```typescript
export const emailSchema = z.string()
  .email('البريد الإلكتروني غير صالح')
  .max(255, 'البريد الإلكتروني طويل جداً (حد أقصى 255 حرف)')
  .optional();
```

**Validation Rules**:
- Valid email format
- Maximum length: 255 characters
- Optional field

---

### Language Validation

**Location**: `apps/bot-server/modules/user-management/handlers/text.handler.ts`

```typescript
export const languageSchema = z.enum(['ar', 'en'], {
  errorMap: () => ({ message: 'اللغة غير صالحة' })
});
```

**Validation Rules**:
- Valid values: 'ar' (Arabic), 'en' (English)
- Required field

---

### Role Validation

**Location**: `apps/bot-server/modules/user-management/services/role.service.ts`

```typescript
export const roleSchema = z.nativeEnum(UserRole, {
  errorMap: () => ({ message: 'الدور غير صالح' })
});
```

**Validation Rules**:
- Valid values: UserRole enum values
- Required field

---

## Cache Strategy

### User Profile Cache

**Location**: `apps/bot-server/modules/user-management/services/user.service.ts`

```typescript
class UserService {
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
  
  static invalidateCache(telegramId: string): void {
    this.cache.delete(telegramId);
  }
}
```

**Cache Strategy**:
- **TTL**: 5 minutes
- **Key**: Telegram ID
- **Value**: User profile + expiration timestamp
- **Invalidation**: On user update

---

## Event Publishing

### User Updated Event

**Event Name**: `user-management.user.updated`

**Payload**:
```typescript
interface UserUpdatedEvent {
  userId: string;
  telegramId: string;
  field: string;
  oldValue?: string;
  newValue: string;
  timestamp: Date;
}
```

**Purpose**: Notify other modules when user profile is updated.

---

### Role Changed Event

**Event Name**: `user-management.role.changed`

**Payload**:
```typescript
interface RoleChangedEvent {
  userId: string;
  telegramId: string;
  oldRole: UserRole;
  newRole: UserRole;
  changedBy: string; // Telegram ID of admin
  timestamp: Date;
}
```

**Purpose**: Notify other modules when user role is changed.

---

## Summary

This feature involves **minimal database schema changes**:

1. **No new tables** - uses existing `users` table
2. **No new columns** - uses existing columns
3. **No migrations** - no schema changes required

**Data Model Changes**:
1. **API Contracts** - UserProfile, UserRole, MenuAction, NavigationState
2. **Data Structures** - Inline Keyboard, UserSearchResult, RoleChangeRequest
3. **Validation Schemas** - Username, Email, Language, Role
4. **Cache Strategy** - User profile cache with 5-minute TTL
5. **Event Publishing** - User updated, Role changed events

All data structures are designed for **Inline Keyboard interactions** with **90% button-based UI** and **10% command shortcuts**.
