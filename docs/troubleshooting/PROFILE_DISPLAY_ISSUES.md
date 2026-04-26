# Profile Display Issues - Deep Diagnosis

## 📋 Executive Summary

This document provides a comprehensive analysis of why new database fields are not displayed in the bot's profile view.

---

## 🔴 Issue: New Fields Not Displayed in Bot Profile

### Problem Description
New fields added to the `UserProfile` database schema (`nationalId`, `mobileNumber`, `birthDate`, `gender`, `governorate`, `countryCode`) are not displayed in the bot's profile view, nor can they be edited.

### Symptoms
- Profile command (`/profile`) only shows: username, email, language, role, createdAt
- Edit menu only has buttons for: name, email, language, role
- No way to view or edit new fields in the bot

### Root Cause Analysis

#### 1. Profile Command Not Updated

**Location**: `f:\Tempot\modules\user-management\commands\profile.command.ts`

**Current Implementation**:
```typescript
const profileMessage = `
👤 ملفك الشخصي

📊 المعلومات:
👤 الاسم: ${user.username || 'غير محدد'}
📧 البريد الإلكتروني: ${user.email || 'غير محدد'}
🌍 اللغة: ${user.language}
🎯 الدور: ${user.role}
📅 تاريخ التسجيل: ${new Date(user.createdAt).toLocaleDateString('ar-EG')}

🔧 ماذا تريد أن تفعل؟
`.trim();
```

**Problem**: New fields (`nationalId`, `mobileNumber`, `birthDate`, `gender`, `governorate`, `countryCode`) are not included in the message template.

**Impact**: Users cannot view their identity information in the bot.

#### 2. Profile Menu Factory Not Updated

**Location**: `f:\Tempot\modules\user-management\menus\profile-menu.factory.ts`

**Current Edit Menu**:
```typescript
static createEdit(): InlineKeyboardMarkup {
  return new InlineKeyboard([
    [
      { text: '👤 الاسم', callback_data: 'profile:edit:name' },
      { text: '📧 البريد', callback_data: 'profile:edit:email' },
    ],
    [
      { text: '🌐 اللغة', callback_data: 'profile:edit:language' },
      { text: '🎯 الدور', callback_data: 'profile:edit:role' },
    ],
    [
      { text: '🔙 العودة', callback_data: 'profile:view' },
    ],
  ]);
}
```

**Problem**: No buttons for editing new fields (`nationalId`, `mobileNumber`, `birthDate`, `gender`, `governorate`).

**Impact**: Users cannot edit their identity information.

#### 3. No Callback Handlers for New Fields

**Location**: `f:\Tempot\modules\user-management\handlers\callback.handler.ts`

**Current Handlers**:
```typescript
case 'edit:name':
  await handleProfileEditNameAction(ctx);
  break;

case 'edit:email':
  await handleProfileEditEmailAction(ctx);
  break;

case 'edit:language':
  await handleProfileEditLanguageAction(ctx);
  break;

case 'edit:role':
  await handleProfileEditRoleAction(ctx);
  break;
```

**Problem**: No handlers for `edit:nationalId`, `edit:mobileNumber`, `edit:birthDate`, `edit:gender`, `edit:governorate`.

**Impact**: Clicking non-existent buttons would result in "unknown action" errors.

#### 4. No Text Handlers for New Fields

**Location**: `f:\Tempot\modules\user-management\handlers\text.handler.ts`

**Current Handlers**:
```typescript
case 'edit_name':
  await handleEditName(ctx, user, text);
  break;

case 'edit_email':
  await handleEditEmail(ctx, user, text);
  break;

case 'edit_language':
  await handleEditLanguage(ctx, user, text);
  break;

case 'edit_role':
  await handleEditRole(ctx, user, text);
  break;
```

**Problem**: No handlers for processing text input for new fields.

**Impact**: Even if buttons existed, text input would not be processed.

#### 5. No Service Methods for New Fields

**Location**: `f:\Tempot\modules\user-management\services\user.service.ts`

**Current Methods**:
```typescript
static async updateUsername(userId: string, newUsername: string): Promise<Result<void, AppError>>
static async updateEmail(userId: string, newEmail: string): Promise<Result<void, AppError>>
static async updateLanguage(userId: string, newLanguage: string): Promise<Result<void, AppError>>
static async updateRole(userId: string, newRole: string): Promise<Result<void, AppError>>
```

**Problem**: No methods for updating new fields.

**Impact**: Cannot update database with new field values.

#### 6. No Repository Methods for New Fields

**Location**: `f:\Tempot\modules\user-management\repositories\user.repository.ts`

**Current Methods**:
```typescript
async updateUsername(userId: string, newUsername: string): Promise<Result<void, AppError>>
async updateEmail(userId: string, newEmail: string): Promise<Result<void, AppError>>
async updateLanguage(userId: string, newLanguage: string): Promise<Result<void, AppError>>
async updateRole(userId: string, newRole: string): Promise<Result<void, AppError>>
```

**Problem**: No methods for updating new fields in database.

**Impact**: Cannot persist new field values to database.

### Impact Assessment
- **Severity**: MEDIUM
- **Frequency**: Every time new fields are added
- **User Impact**: Cannot view or edit identity information

### Solution

#### Immediate Solution

##### 1. Update Profile Command
Add new fields to profile message template:

```typescript
const profileMessage = `
👤 ملفك الشخصي

📊 المعلومات الأساسية:
👤 الاسم: ${user.username || 'غير محدد'}
📧 البريد الإلكتروني: ${user.email || 'غير محدد'}
🌍 اللغة: ${user.language}
🎯 الدور: ${user.role}

📊 معلومات الهوية:
🆔 الرقم القومي: ${user.nationalId || 'غير محدد'}
📱 رقم الموبيل: ${user.mobileNumber || 'غير محدد'}
🎂 تاريخ الميلاد: ${user.birthDate ? new Date(user.birthDate).toLocaleDateString('ar-EG') : 'غير محدد'}
👥 الجنس: ${user.gender === 'male' ? 'ذكر' : user.gender === 'female' ? 'أنثى' : 'غير محدد'}
🏙️ المحافظة: ${user.governorate || 'غير محدد'}
🌍 مفتاح الدولة: ${user.countryCode || '+20'}

📅 تاريخ التسجيل: ${new Date(user.createdAt).toLocaleDateString('ar-EG')}

🔧 ماذا تريد أن تفعل؟
`.trim();
```

##### 2. Update Profile Menu Factory
Add buttons for editing new fields:

```typescript
static createEdit(): InlineKeyboardMarkup {
  return new InlineKeyboard([
    [
      { text: '👤 الاسم', callback_data: 'profile:edit:name' },
      { text: '📧 البريد', callback_data: 'profile:edit:email' },
    ],
    [
      { text: '🆔 الرقم القومي', callback_data: 'profile:edit:nationalId' },
      { text: '📱 رقم الموبيل', callback_data: 'profile:edit:mobileNumber' },
    ],
    [
      { text: '🎂 تاريخ الميلاد', callback_data: 'profile:edit:birthDate' },
      { text: '👥 الجنس', callback_data: 'profile:edit:gender' },
    ],
    [
      { text: '🏙️ المحافظة', callback_data: 'profile:edit:governorate' },
      { text: '🌍 مفتاح الدولة', callback_data: 'profile:edit:countryCode' },
    ],
    [
      { text: '🌐 اللغة', callback_data: 'profile:edit:language' },
      { text: '🎯 الدور', callback_data: 'profile:edit:role' },
    ],
    [
      { text: '🔙 العودة', callback_data: 'profile:view' },
    ],
  ]);
}
```

##### 3. Add Callback Handlers
Add handlers for new fields in `callback.handler.ts`:

```typescript
case 'edit:nationalId':
  await handleProfileEditNationalIdAction(ctx);
  break;

case 'edit:mobileNumber':
  await handleProfileEditMobileNumberAction(ctx);
  break;

case 'edit:birthDate':
  await handleProfileEditBirthDateAction(ctx);
  break;

case 'edit:gender':
  await handleProfileEditGenderAction(ctx);
  break;

case 'edit:governorate':
  await handleProfileEditGovernorateAction(ctx);
  break;

case 'edit:countryCode':
  await handleProfileEditCountryCodeAction(ctx);
  break;
```

##### 4. Add Text Handlers
Add handlers for processing text input in `text.handler.ts`:

```typescript
case 'edit_nationalId':
  await handleEditNationalId(ctx, user, text);
  break;

case 'edit_mobileNumber':
  await handleEditMobileNumber(ctx, user, text);
  break;

case 'edit_birthDate':
  await handleEditBirthDate(ctx, user, text);
  break;

case 'edit_gender':
  await handleEditGender(ctx, user, text);
  break;

case 'edit_governorate':
  await handleEditGovernorate(ctx, user, text);
  break;

case 'edit_countryCode':
  await handleEditCountryCode(ctx, user, text);
  break;
```

##### 5. Add Service Methods
Add methods for updating new fields in `user.service.ts`:

```typescript
static async updateNationalId(userId: string, newNationalId: string): Promise<Result<void, AppError>>
static async updateMobileNumber(userId: string, newMobileNumber: string): Promise<Result<void, AppError>>
static async updateBirthDate(userId: string, newBirthDate: Date): Promise<Result<void, AppError>>
static async updateGender(userId: string, newGender: string): Promise<Result<void, AppError>>
static async updateGovernorate(userId: string, newGovernorate: string): Promise<Result<void, AppError>>
static async updateCountryCode(userId: string, newCountryCode: string): Promise<Result<void, AppError>>
```

##### 6. Add Repository Methods
Add methods for updating new fields in `user.repository.ts`:

```typescript
async updateNationalId(userId: string, newNationalId: string): Promise<Result<void, AppError>>
async updateMobileNumber(userId: string, newMobileNumber: string): Promise<Result<void, AppError>>
async updateBirthDate(userId: string, newBirthDate: Date): Promise<Result<void, AppError>>
async updateGender(userId: string, newGender: string): Promise<Result<void, AppError>>
async updateGovernorate(userId: string, newGovernorate: string): Promise<Result<void, AppError>>
async updateCountryCode(userId: string, newCountryCode: string): Promise<Result<void, AppError>>
```

#### Long-term Solution

##### 1. Use Input-Engine for Validation
Use `@tempot/input-engine` for validating and parsing input:

```typescript
import { NationalIDFieldHandler } from '@tempot/input-engine';
import { EgyptianMobileFieldHandler } from '@tempot/input-engine';

// For National ID
const nationalIdHandler = new NationalIDFieldHandler();
const result = await nationalIdHandler.validate(text, {}, { extractData: true });

// For Mobile Number
const mobileHandler = new EgyptianMobileFieldHandler();
const result = await mobileHandler.validate(text, {}, {});
```

##### 2. Auto-Generate Profile Fields from Database Schema
Create a system that auto-generates profile fields from the database schema, eliminating manual updates.

##### 3. Create Generic Profile Field System
Create a generic system for managing profile fields that can be extended without code changes.

---

## 📊 Summary

| Component | Issue | Impact | Status |
|-----------|-------|--------|--------|
| Profile Command | Missing fields | Cannot view identity info | ❌ Not Fixed |
| Menu Factory | Missing buttons | Cannot edit identity info | ❌ Not Fixed |
| Callback Handlers | Missing handlers | Buttons don't work | ❌ Not Fixed |
| Text Handlers | Missing handlers | Input not processed | ❌ Not Fixed |
| Service Methods | Missing methods | Cannot update database | ❌ Not Fixed |
| Repository Methods | Missing methods | Cannot persist data | ❌ Not Fixed |

---

## 🔧 Recommended Actions

### Priority 1: Update Profile Display
1. Update profile command to show new fields
2. Update menu factory to add edit buttons
3. Test profile display

### Priority 2: Add Edit Functionality
1. Add callback handlers for new fields
2. Add text handlers for processing input
3. Test edit functionality

### Priority 3: Add Validation
1. Integrate input-engine for validation
2. Add error handling for invalid input
3. Test validation

### Priority 4: Implement Auto-Generation
1. Create schema-based field generation
2. Eliminate manual updates
3. Test auto-generation

---

## 📚 References

- Input-Engine Documentation: `f:\Tempot\packages\input-engine\docs\`
- National ID Handler: `f:\Tempot\packages\input-engine\src\fields\identity\national-id.field.ts`
- Egyptian Mobile Handler: `f:\Tempot\packages\input-engine\src\fields\identity\egyptian-mobile.field.ts`

---

**Last Updated**: 2026-04-26
**Status**: Needs Implementation
