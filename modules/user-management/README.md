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
| @tempot/ux-helpers | Inline keyboards, status messages |
| @tempot/regional-engine | Date/number formatting |
| @tempot/input-engine | Dynamic forms |
| @tempot/auth-core | Authorization |

## Status

✅ **Implemented** — Phase 1
