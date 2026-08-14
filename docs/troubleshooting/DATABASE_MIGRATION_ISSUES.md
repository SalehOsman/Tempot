# Database Migration Issues - Deep Diagnosis

## 📋 Executive Summary

This document provides a comprehensive analysis of database migration issues in the Tempot project.

---

## 🔴 Issue 1: Prisma Migrate Fails with Docker

### Problem Description
Prisma migrate commands fail when running with Docker containers, specifically:
- `pnpm db:migrate` fails with lock timeout errors
- `prisma migrate dev` fails with advisory lock errors
- Manual migration creation fails with database connection errors

### Root Cause Analysis

#### 1.1 Advisory Lock Timeout
```
Error: P1002
The database server was reached but timed out.
Context: Timed out trying to acquire a postgres advisory lock (SELECT pg_advisory_lock(72707369)). Timeout: 10000ms
```

**Cause**: Prisma uses PostgreSQL advisory locks to prevent concurrent migrations. When the bot server is running, it holds connections to the database, preventing Prisma from acquiring the lock.

**Evidence**:
- Error occurs only when bot server is running
- Error resolves when bot server is stopped
- Lock timeout is exactly 10 seconds (Prisma default)

#### 1.2 Migration File Not Found
```
Error: P3015
Could not find the migration file at migration.sql. Please delete the directory or restore the migration file.
```

**Cause**: Manual migration directory creation without proper migration.sql file.

**Evidence**:
- Directory `20260426133000_add_identity_fields` was created manually
- No migration.sql file was generated
- Prisma expects specific directory structure

### Impact Assessment
- **Severity**: HIGH
- **Frequency**: Every time database schema changes
- **User Impact**: Cannot update database schema, blocks development

### Solution

#### Immediate Solution
```bash
# 1. Stop bot server
docker-compose down

# 2. Apply migration manually
docker exec -i tempot-postgres psql -U tempot -d tempot_db < migration.sql

# 3. Update Prisma Client
cd packages/database && pnpm db:generate

# 4. Restart services
docker-compose up -d
```

#### Long-term Solution
1. Create migration script that handles advisory locks gracefully
2. Implement health check that waits for database to be ready
3. Use Prisma Migrate in production with proper locking strategy

---

## 🔴 Issue 2: Docker Build Fails for Bot Server

### Problem Description
Docker build for bot server fails, but local build with `pnpm dev` works successfully.

### Root Cause Analysis

#### 2.1 Build Context Issues
**Potential Causes**:
- Large build context (2.75MB)
- Slow package resolution (1323 packages)
- Network timeouts during package downloads

**Evidence**:
- Build takes 3-5 minutes
- Multiple warnings about slow download speeds
- Some packages timeout (up to 30 seconds)

#### 2.2 Dependency Resolution
**Potential Causes**:
- `pnpm install --frozen-lockfile` may have issues with Docker
- Some packages may have platform-specific dependencies
- Prisma engines download may fail

**Evidence**:
- Warnings about slow downloads for Prisma packages
- Some packages require platform-specific binaries

### Impact Assessment
- **Severity**: MEDIUM
- **Frequency**: Every time Docker image is rebuilt
- **User Impact**: Cannot deploy to Docker, but can run locally

### Solution

#### Immediate Solution
Continue using local development with `pnpm dev` until Docker build issues are resolved.

#### Long-term Solution
1. Optimize Dockerfile with multi-stage builds
2. Use build cache effectively
3. Pre-download dependencies in separate layer
4. Consider using Docker buildx for better caching

---

## 🔴 Issue 3: New Fields Not Displayed in Bot

### Problem Description
New fields added to database schema (`nationalId`, `mobileNumber`, `birthDate`, `gender`, `governorate`, `countryCode`) are not displayed in the bot's profile view.

### Root Cause Analysis

#### 3.1 Profile Command Not Updated
**Cause**: `profile.command.ts` does not display the new fields.

**Evidence**:
- Profile message template only shows: username, email, language, role, createdAt
- New fields are not included in the message

**Location**: `f:\Tempot\modules\user-management\commands\profile.command.ts`

#### 3.2 Profile Menu Factory Not Updated
**Cause**: `ProfileMenuFactory` does not include buttons for editing new fields.

**Evidence**:
- Edit menu only has: name, email, language, role
- No buttons for: nationalId, mobileNumber, birthDate, gender, governorate

**Location**: `f:\Tempot\modules\user-management\menus\profile-menu.factory.ts`

#### 3.3 No Handlers for New Fields
**Cause**: No callback handlers or text handlers for editing new fields.

**Evidence**:
- `callback.handler.ts` has handlers for: name, email, language, role
- No handlers for: nationalId, mobileNumber, birthDate, gender, governorate
- `text.handler.ts` has handlers for: name, email, language, role
- No handlers for: nationalId, mobileNumber, birthDate, gender, governorate

**Location**: `f:\Tempot\modules\user-management\handlers\callback.handler.ts` and `text.handler.ts`

### Impact Assessment
- **Severity**: MEDIUM
- **Frequency**: Every time new fields are added
- **User Impact**: Cannot view or edit new fields in bot

### Solution

#### Immediate Solution
Update profile command and menu factory to display and edit new fields.

#### Long-term Solution
1. Create generic profile field system
2. Use input-engine for validation
3. Auto-generate profile fields from database schema

---

## 📊 Summary of Issues

| Issue | Severity | Frequency | Impact | Status |
|-------|----------|-----------|--------|--------|
| Database Migration Lock | HIGH | Every schema change | Blocks development | ⚠️ Partially Fixed |
| Docker Build Failure | MEDIUM | Every Docker build | Blocks deployment | ❌ Not Fixed |
| New Fields Not Displayed | MEDIUM | Every new field | Poor UX | ❌ Not Fixed |

---

## 🔧 Recommended Actions

### Priority 1: Fix Database Migration
1. Create automated migration script
2. Implement proper lock handling
3. Add migration status tracking

### Priority 2: Fix Docker Build
1. Optimize Dockerfile
2. Implement better caching
3. Add build health checks

### Priority 3: Fix Profile Display
1. Update profile command
2. Update menu factory
3. Add handlers for new fields

---

## 📚 References

- Prisma Migration Documentation: https://www.prisma.io/docs/concepts/components/prisma-migrate
- PostgreSQL Advisory Locks: https://www.postgresql.org/docs/current/explicit-locking.html
- Docker Best Practices: https://docs.docker.com/develop/dev-best-practices/

---

**Last Updated**: 2026-04-26
**Status**: Active Investigation
