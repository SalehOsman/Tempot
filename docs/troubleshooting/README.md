# Troubleshooting Guide - Tempot Project

## 📋 Overview

This directory contains comprehensive troubleshooting documentation for the Tempot project, focusing on database migrations, Docker builds, and profile display issues.

---

## 📚 Available Documentation

### 1. [Database Migration Issues](./DATABASE_MIGRATION_ISSUES.md)
**Focus**: Prisma migrate failures, advisory locks, migration file issues

**Key Problems**:
- Prisma migrate fails with lock timeout errors
- Manual migration creation fails
- Migration files not found

**Solutions**:
- Stop bot server before running migrations
- Apply migrations manually via psql
- Implement proper lock handling

### 2. [Docker Build Issues](./DOCKER_BUILD_ISSUES.md)
**Focus**: Docker build failures, slow builds, build context optimization

**Key Problems**:
- Docker build takes 3-5 minutes (vs 30 seconds locally)
- Slow package downloads
- No layer caching
- Large build context (2.75MB)

**Solutions**:
- Create .dockerignore file
- Optimize Dockerfile with multi-stage builds
- Use BuildKit for better caching
- Implement build cache strategy

### 3. [Profile Display Issues](./PROFILE_DISPLAY_ISSUES.md)
**Focus**: New database fields not displayed in bot profile

**Key Problems**:
- New fields not shown in profile view
- No edit buttons for new fields
- No handlers for processing new field input
- No service/repository methods for updating new fields

**Solutions**:
- Update profile command to show new fields
- Update menu factory to add edit buttons
- Add callback/text handlers for new fields
- Add service/repository methods for updating fields
- Integrate input-engine for validation

---

## 🔍 Common Issues & Solutions

### Issue 1: Database Migration Fails

**Symptoms**:
```
Error: P1002
The database server was reached but timed out.
Context: Timed out trying to acquire a postgres advisory lock
```

**Cause**: Bot server is running and holding database connections.

**Solution**:
```bash
# Stop bot server
docker-compose down

# Apply migration manually
docker exec -i tempot-postgres psql -U tempot -d tempot_db < migration.sql

# Restart services
docker-compose up -d
```

### Issue 2: Docker Build Slow

**Symptoms**:
- Build takes 3-5 minutes
- Multiple warnings about slow downloads
- Some packages timeout

**Cause**: Large build context, no layer caching, slow network.

**Solution**:
```bash
# Create .dockerignore
echo "node_modules
dist
*.log
.env
.DS_Store
coverage
.vscode
.idea
*.md
!README.md
docs
.git
.gitignore
pnpm-lock.yaml" > .dockerignore

# Use BuildKit
DOCKER_BUILDKIT=1 docker build -t tempot-bot-server .

# Use build cache
docker build --cache-from tempot-bot-server:latest -t tempot-bot-server .
```

### Issue 3: New Fields Not Displayed

**Symptoms**:
- New fields not shown in profile view
- No edit buttons for new fields

**Cause**: Profile command and menu factory not updated.

**Solution**:
1. Update `modules/user-management/commands/profile.command.ts` to display new fields
2. Update `modules/user-management/menus/profile-menu.factory.ts` to add edit buttons
3. Add handlers in `modules/user-management/handlers/callback.handler.ts` and `text.handler.ts`
4. Add methods in `modules/user-management/services/user.service.ts` and `repositories/user.repository.ts`

---

## 🛠️ Development Workflow

### Recommended Workflow for Database Changes

1. **Stop all services**:
   ```bash
   docker-compose down
   ```

2. **Update Prisma schema**:
   ```bash
   # Edit packages/database/prisma/base.prisma
   ```

3. **Generate migration**:
   ```bash
   cd packages/database
   pnpm prisma migrate dev --create-only --name <migration_name>
   ```

4. **Review migration SQL**:
   ```bash
   cat prisma/migrations/<timestamp>_<migration_name>/migration.sql
   ```

5. **Apply migration manually**:
   ```bash
   docker exec -i tempot-postgres psql -U tempot -d tempot_db < prisma/migrations/<timestamp>_<migration_name>/migration.sql
   ```

6. **Generate Prisma Client**:
   ```bash
   pnpm db:generate
   ```

7. **Rebuild affected modules**:
   ```bash
   cd modules/<module-name>
   pnpm build
   ```

8. **Restart services**:
   ```bash
   cd ../../..
   docker-compose up -d
   ```

9. **Test changes**:
   ```bash
   pnpm dev
   ```

### Recommended Workflow for Docker Builds

1. **Clean build**:
   ```bash
   docker-compose down
   docker system prune -f
   ```

2. **Build with BuildKit**:
   ```bash
   DOCKER_BUILDKIT=1 docker-compose build --no-cache
   ```

3. **Start services**:
   ```bash
   docker-compose up -d
   ```

4. **Check logs**:
   ```bash
   docker-compose logs -f
   ```

### Recommended Workflow for Profile Changes

1. **Update database schema** (if needed)
2. **Update profile command** to display new fields
3. **Update menu factory** to add edit buttons
4. **Add callback handlers** for new fields
5. **Add text handlers** for processing input
6. **Add service methods** for updating fields
7. **Add repository methods** for persisting data
8. **Integrate input-engine** for validation (optional)
9. **Rebuild module**:
   ```bash
   cd modules/user-management
   pnpm build
   ```
10. **Test changes**:
    ```bash
   cd ../..
   pnpm dev
   ```

---

## 📊 Issue Status

| Issue | Severity | Status | Priority |
|-------|----------|--------|----------|
| Database Migration Lock | HIGH | ⚠️ Partially Fixed | P1 |
| Docker Build Optimization | MEDIUM | ❌ Not Fixed | P2 |
| Profile Display Update | MEDIUM | ❌ Not Fixed | P1 |

---

## 🎯 Next Steps

### Immediate Actions (This Week)
1. ✅ Document all issues (DONE)
2. ⏭️ Fix database migration workflow
3. ⏭️ Update profile display
4. ⏭️ Add edit functionality for new fields

### Short-term Actions (Next 2 Weeks)
1. ⏭️ Optimize Docker build
2. ⏭️ Create .dockerignore
3. ⏭️ Implement build cache strategy
4. ⏭️ Integrate input-engine for validation

### Long-term Actions (Next Month)
1. ⏭️ Implement auto-generation of profile fields
2. ⏭️ Create generic profile field system
3. ⏭️ Add automated migration testing
4. ⏭️ Implement CI/CD with build cache

---

## 🔗 Related Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Docker Documentation](https://docs.docker.com)
- [Input-Engine Documentation](../../packages/input-engine/docs/)

---

## 📝 Contributing

When adding new troubleshooting documentation:

1. Create a new markdown file in this directory
2. Follow the naming convention: `<ISSUE_NAME>_ISSUES.md`
3. Include:
   - Executive summary
   - Problem description
   - Root cause analysis
   - Impact assessment
   - Solutions (immediate and long-term)
   - Summary table
   - Recommended actions
   - References
4. Update this README with a link to the new document
5. Update the issue status table

---

**Last Updated**: 2026-04-26
**Maintainer**: Tempot Development Team
**Status**: Active Development
