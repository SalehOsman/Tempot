# Docker Build Issues - Deep Diagnosis

## 📋 Executive Summary

This document provides a comprehensive analysis of Docker build failures for the bot server.

---

## 🔴 Issue: Docker Build Fails for Bot Server

### Problem Description
Docker build for bot server fails or takes excessively long, but local build with `pnpm dev` works successfully.

### Symptoms
- Build takes 3-5 minutes (vs 30 seconds locally)
- Multiple warnings about slow package downloads
- Some packages timeout during download
- Build succeeds but with warnings

### Root Cause Analysis

#### 1. Build Context Size
**Issue**: Build context is 2.75MB, which is large for a Docker build.

**Evidence**:
```
#7 [internal] load build context
#7 transferring context: 2.75MB 4.8s done
```

**Impact**: Slower build times, increased network usage

#### 2. Package Download Speed
**Issue**: Many packages download at speeds below 50 KiB/s.

**Evidence**:
```
WARN  Tarball download average speed 25 KiB/s (size 45 KiB)
WARN  Tarball download average speed 37 KiB/s (size 123 KiB)
WARN  Tarball download average speed 34 KiB/s (size 116 KiB)
```

**Impact**: Slow package resolution, timeouts

#### 3. Network Latency
**Issue**: Some requests take 10-30 seconds.

**Evidence**:
```
WARN  Request took 10255ms: https://registry.npmjs.org/@prisma%2Fengines
WARN  Request took 24080ms: https://registry.npmjs.org/@prisma%2Fget-platform
WARN  Request took 27225ms: https://registry.npmjs.org/@prisma%2Ffetch-engine
```

**Impact**: Slow build process

#### 4. Prisma Engine Downloads
**Issue**: Prisma engines are large and take time to download.

**Evidence**:
```
WARN  Request took 49758ms: https://registry.npmjs.org/@prisma%2Fclient
```

**Impact**: Significant delay in build process

#### 5. Platform-Specific Binaries
**Issue**: Some packages require platform-specific binaries (rolldown, esbuild).

**Evidence**:
```
WARN  Request took 10690ms: https://registry.npmjs.org/@rolldown%2Fbinding-win32-x64-msvc
WARN  Request took 11142ms: https://registry.npmjs.org/@rolldown%2Fbinding-darwin-arm64
```

**Impact**: Additional download time for each platform

### Build Process Analysis

#### Stage 1: Base Image
```
#6 [base 1/2] FROM docker.io/library/node:22-alpine@sha256:...
#6 CACHED
```
✅ **Status**: Good - Uses cached base image

#### Stage 2: Corepack
```
#8 [base 2/2] RUN corepack enable
#8 DONE 2.7s
```
✅ **Status**: Good - Fast

#### Stage 3: Install Dependencies
```
#11 [builder 3/8] RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
#11 DONE 92.5s
```
⚠️ **Status**: Slow - Takes 92.5 seconds

#### Stage 4: Generate Prisma Client
```
#12 [builder 4/8] RUN pnpm --filter @tempot/database exec prisma generate
#12 DONE 9.5s
```
✅ **Status**: Good - Fast

#### Stage 5: Build Packages
```
#13 [builder 5/8] RUN pnpm --filter bot-server... build
#13 DONE 42.6s
```
✅ **Status**: Good - Acceptable

#### Stage 6: Build Modules
```
#14 [builder 6/8] RUN pnpm --filter "@tempot/*-module" build
#14 DONE 5.2s
```
✅ **Status**: Good - Fast

#### Stage 7: Deploy Dependencies
```
#15 [builder 7/8] RUN pnpm deploy --filter bot-server --prod --legacy /app/out
#15 DONE 122.2s
```
⚠️ **Status**: Slow - Takes 122.2 seconds

#### Stage 8: Final Image
```
#21 exporting to image
#21 DONE 41.6s
```
✅ **Status**: Good - Acceptable

### Total Build Time: ~317 seconds (5.3 minutes)

### Bottlenecks Identified

1. **Package Installation**: 92.5 seconds (29%)
2. **Deploy Dependencies**: 122.2 seconds (38%)
3. **Export Image**: 41.6 seconds (13%)

### Dockerfile Analysis

```dockerfile
# Current Dockerfile (apps/bot-server/Dockerfile)
FROM node:22-alpine AS base
RUN corepack enable

WORKDIR /app

FROM base AS builder
COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm --filter @tempot/database exec prisma generate
RUN pnpm --filter bot-server... build
RUN pnpm --filter "@tempot/*-module" build
RUN pnpm deploy --filter bot-server --prod --legacy /app/out

FROM node:22-alpine AS runner
WORKDIR /app
COPY --from=builder /app/out ./
COPY --from=builder /app/modules ./modules
COPY specs ./specs
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 hono --ingroup nodejs
USER hono
CMD ["node", "dist/index.js"]
```

### Issues in Dockerfile

1. **No .dockerignore**: All files copied including node_modules
2. **No build cache optimization**: Dependencies installed every time
3. **No layer caching**: All steps run even if nothing changed
4. **Large build context**: 2.75MB transferred every time

### Impact Assessment
- **Severity**: MEDIUM
- **Frequency**: Every Docker build
- **User Impact**: Cannot deploy to Docker efficiently

### Solution

#### Immediate Solution
Continue using local development with `pnpm dev` until Docker build is optimized.

#### Long-term Solution

##### 1. Create .dockerignore
```
node_modules
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
pnpm-lock.yaml
```

##### 2. Optimize Dockerfile
```dockerfile
FROM node:22-alpine AS base
RUN corepack enable

WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --prod=false

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile
RUN pnpm --filter @tempot/database exec prisma generate
RUN pnpm --filter bot-server... build
RUN pnpm --filter "@tempot/*-module" build

FROM node:22-alpine AS runner
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/modules ./modules
COPY specs ./specs
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 hono --ingroup nodejs
USER hono
CMD ["node", "dist/index.js"]
```

##### 3. Use BuildKit
```bash
DOCKER_BUILDKIT=1 docker build -t tempot-bot-server .
```

##### 4. Use Build Cache
```bash
docker build --cache-from tempot-bot-server:latest -t tempot-bot-server .
```

### Expected Improvements

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Build Time | 317s | ~120s | 62% faster |
| Context Size | 2.75MB | ~500KB | 82% smaller |
| Cache Hits | 0% | 80%+ | 80%+ faster |

---

## 📊 Summary

| Issue | Severity | Impact | Status |
|-------|----------|--------|--------|
| Large Build Context | MEDIUM | Slower builds | ⚠️ Identified |
| Slow Package Downloads | MEDIUM | Slower builds | ⚠️ Identified |
| No Layer Caching | HIGH | No cache reuse | ⚠️ Identified |
| No .dockerignore | MEDIUM | Large context | ⚠️ Identified |

---

## 🔧 Recommended Actions

### Priority 1: Create .dockerignore
1. Create comprehensive .dockerignore file
2. Test build context size reduction

### Priority 2: Optimize Dockerfile
1. Implement multi-stage build with dependency caching
2. Separate dev and prod dependencies
3. Use BuildKit for better caching

### Priority 3: Use Build Cache
1. Enable BuildKit
2. Use cache-from for faster rebuilds
3. Implement CI/CD with build cache

---

## 📚 References

- Docker Best Practices: https://docs.docker.com/develop/dev-best-practices/
- Docker BuildKit: https://docs.docker.com/build/buildkit/
- Multi-stage Builds: https://docs.docker.com/build/building/multi-stage/

---

**Last Updated**: 2026-04-26
**Status**: Needs Implementation
