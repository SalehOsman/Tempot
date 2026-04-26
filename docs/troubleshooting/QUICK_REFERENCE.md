# Quick Reference - Tempot Troubleshooting

## 🚨 Quick Fixes

### Database Migration Fails
```bash
# Stop bot server
docker-compose down

# Apply migration manually
docker exec -i tempot-postgres psql -U tempot -d tempot_db < migration.sql

# Generate Prisma Client
cd packages/database && pnpm db:generate

# Restart services
cd ../.. && docker-compose up -d
```

### Docker Build Slow
```bash
# Clean build
docker-compose down
docker system prune -f

# Build with BuildKit
DOCKER_BUILDKIT=1 docker-compose build --no-cache

# Start services
docker-compose up -d
```

### New Fields Not Displayed
1. Update `modules/user-management/commands/profile.command.ts`
2. Update `modules/user-management/menus/profile-menu.factory.ts`
3. Add handlers in `modules/user-management/handlers/callback.handler.ts`
4. Add handlers in `modules/user-management/handlers/text.handler.ts`
5. Add methods in `modules/user-management/services/user.service.ts`
6. Add methods in `modules/user-management/repositories/user.repository.ts`
7. Rebuild: `cd modules/user-management && pnpm build`
8. Restart: `cd ../.. && pnpm dev`

---

## 📋 Common Commands

### Database Operations
```bash
# Check database tables
docker exec -i tempot-postgres psql -U tempot -d tempot_db -c "\dt"

# Check table structure
docker exec -i tempot-postgres psql -U tempot -d tempot_db -c "\d UserProfile"

# Check specific columns
docker exec -i tempot-postgres psql -U tempot -d tempot_db -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'UserProfile' ORDER BY ordinal_position;"

# Apply migration
docker exec -i tempot-postgres psql -U tempot -d tempot_db < migration.sql

# Generate Prisma Client
cd packages/database && pnpm db:generate

# Run migration
cd packages/database && pnpm db:migrate
```

### Docker Operations
```bash
# Stop all services
docker-compose down

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f bot-server
docker-compose logs -f postgres
docker-compose logs -f redis

# Rebuild specific service
docker-compose build bot-server

# Rebuild all services
docker-compose build

# Clean up
docker-compose down -v
docker system prune -f
```

### Development Operations
```bash
# Build specific module
cd modules/<module-name> && pnpm build

# Build all modules
pnpm --filter "@tempot/*-module" build

# Start bot server
cd apps/bot-server && pnpm dev

# Start bot server from root
pnpm dev
```

---

## 🔍 Error Messages & Solutions

### Error: P1002 - Advisory Lock Timeout
```
Error: P1002
The database server was reached but timed out.
Context: Timed out trying to acquire a postgres advisory lock
```
**Solution**: Stop bot server before running migrations.

### Error: P3015 - Migration File Not Found
```
Error: P3015
Could not find the migration file at migration.sql.
```
**Solution**: Delete the migration directory and recreate it properly.

### Error: Column Does Not Exist
```
Error: column UserProfile.nationalId does not exist
```
**Solution**: Apply migration to add the column to the database.

### Error: No Such Image
```
Error: No such image: tempot-bot:latest
```
**Solution**: Build the Docker image first: `docker-compose build`

---

## 📊 File Locations

### Database Files
- Schema: `packages/database/prisma/base.prisma`
- Migrations: `packages/database/prisma/migrations/`
- Merge Script: `packages/database/scripts/merge-schemas.ts`

### User Management Module
- Commands: `modules/user-management/commands/`
- Handlers: `modules/user-management/handlers/`
- Menus: `modules/user-management/menus/`
- Services: `modules/user-management/services/`
- Repositories: `modules/user-management/repositories/`
- Types: `modules/user-management/types/`

### Docker Files
- Docker Compose: `docker-compose.yml`
- Bot Server Dockerfile: `apps/bot-server/Dockerfile`
- Environment: `.env`

---

## 🎯 Development Workflow

### Adding New Database Field

1. **Update Schema**:
   ```bash
   # Edit packages/database/prisma/base.prisma
   # Add new field to UserProfile model
   ```

2. **Create Migration**:
   ```bash
   cd packages/database
   pnpm prisma migrate dev --create-only --name add_<field_name>
   ```

3. **Apply Migration**:
   ```bash
   docker-compose down
   docker exec -i tempot-postgres psql -U tempot -d tempot_db < prisma/migrations/<timestamp>/migration.sql
   docker-compose up -d
   ```

4. **Generate Prisma Client**:
   ```bash
   pnpm db:generate
   ```

5. **Update Types**:
   ```bash
   # Edit modules/user-management/types/user.types.ts
   # Add new field to UserProfile interface
   ```

6. **Update Profile Command**:
   ```bash
   # Edit modules/user-management/commands/profile.command.ts
   # Add new field to profile message
   ```

7. **Update Menu Factory**:
   ```bash
   # Edit modules/user-management/menus/profile-menu.factory.ts
   # Add edit button for new field
   ```

8. **Add Handlers**:
   ```bash
   # Edit modules/user-management/handlers/callback.handler.ts
   # Add callback handler for new field

   # Edit modules/user-management/handlers/text.handler.ts
   # Add text handler for new field
   ```

9. **Add Service Methods**:
   ```bash
   # Edit modules/user-management/services/user.service.ts
   # Add update method for new field
   ```

10. **Add Repository Methods**:
    ```bash
    # Edit modules/user-management/repositories/user.repository.ts
    # Add update method for new field
    ```

11. **Rebuild Module**:
    ```bash
    cd modules/user-management
    pnpm build
    ```

12. **Test**:
    ```bash
    cd ../..
    pnpm dev
    ```

---

## 🔧 Troubleshooting Steps

### Step 1: Identify the Problem
- Read error message carefully
- Check logs for additional context
- Identify which component is affected

### Step 2: Check Documentation
- Read relevant troubleshooting document
- Check for known issues and solutions
- Follow recommended steps

### Step 3: Apply Solution
- Stop affected services if needed
- Apply recommended fix
- Restart services

### Step 4: Verify Fix
- Test the functionality
- Check logs for errors
- Confirm issue is resolved

### Step 5: Document
- Update relevant documentation
- Add new issues if discovered
- Share solution with team

---

## 📞 Support

If you encounter an issue not covered in this documentation:

1. Check the detailed troubleshooting documents:
   - [Database Migration Issues](./DATABASE_MIGRATION_ISSUES.md)
   - [Docker Build Issues](./DOCKER_BUILD_ISSUES.md)
   - [Profile Display Issues](./PROFILE_DISPLAY_ISSUES.md)

2. Check the summary document:
   - [Issues Summary](./SUMMARY.md)

3. Check the main troubleshooting guide:
   - [Troubleshooting Guide](./README.md)

4. Contact the development team with:
   - Error message
   - Steps to reproduce
   - Logs
   - Environment details

---

**Last Updated**: 2026-04-26
**Status**: Quick Reference
