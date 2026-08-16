# Docker Build Architecture & Troubleshooting Guide

## 📋 Executive Summary

This document explains the production Docker build architecture for Tempot (`apps/bot-server/Dockerfile`), the role of `.dockerignore`, and how to diagnose and resolve container build challenges.

---

## 🏗️ Docker Build Architecture

Tempot utilizes a **multi-stage Dockerfile** (`apps/bot-server/Dockerfile`) optimized for `pnpm` monorepos, isolated runtime packaging, and security hardening (non-root execution).

### Multi-Stage Lifecycle

```
[base stage] node:22.12-alpine
    ├── Alpine OS upgrades + openssl + libc6-compat + postgresql16-client
    └── Corepack / pnpm@10.33.3 installation
           │
           ▼
[builder stage]
    ├── (1) Cache-mounted pnpm install (`/pnpm/store`)
    ├── (2) Initial Prisma Client generation for TypeScript compilation
    ├── (3) Compile bot runtime packages (`pnpm build:bot-runtime`)
    ├── (4) Runtime manifest generation (`pnpm runtime:manifest`)
    ├── (5) Isolated production deploy via `pnpm deploy --filter bot-server --prod /app/out`
    └── (6) In-store Prisma regeneration inside `/app/out/node_modules/@tempot/database`
           │
           ▼
[runner stage] Minimal production image
    ├── Copies compiled dist, node_modules, and runtime modules from builder
    ├── Strips package managers (`npm`, `pnpm`, `corepack`) to reduce CVE surface
    ├── Runs as non-root system user `hono:nodejs` (UID 1001)
    └── Entrypoint: `node dist/index.js` (Port 3000)
```

---

## 📁 Build Context Filtering (`.dockerignore`)

The repository includes a comprehensive `.dockerignore` at root that excludes non-runtime assets:
- Git histories (`.git/`, `.worktrees/`)
- SpecKit artifacts and AI configurations (`.specify/`, `.claude/`, `.gemini/`, `.agents/`)
- Host node_modules (`node_modules/`, `apps/*/node_modules/`, etc.)
- Test suites and fixtures (`**/__tests__`, `**/*.test.ts`)
- Architecture/developer documentation (`docs/archive/`, `docs/developer/`, etc.)
- Local database volumes (`postgres_data/`, `redis_data/`)

---

## 🔍 Common Build Issues & Solutions

### 1. Slow Initial Build or Dependency Download Delays
* **Symptom:** First build takes longer to download packages.
* **Explanation:** BuildKit utilizes `/pnpm/store` cache. Subsequent builds reuse downloaded tarballs from the Docker cache.
* **Solution:** Ensure BuildKit is enabled when building:
  ```bash
  DOCKER_BUILDKIT=1 docker compose build
  ```

### 2. Prisma Engine Compatibility on Alpine
* **Symptom:** `PrismaClientInitializationError: Unable to require... libc6-compat`.
* **Explanation:** Prisma engines compiled for musl/libc require `openssl` and `libc6-compat` libraries on Alpine.
* **Solution:** The `base` stage in `apps/bot-server/Dockerfile` installs `openssl libc6-compat postgresql16-client`. If modifying base dependencies, preserve these packages.

### 3. Rebuilding After Code / Module Changes
* **Symptom:** Container running old code after local updates.
* **Solution:** Force a rebuild of the bot-server image:
  ```bash
  docker compose build bot-server
  docker compose up -d bot-server
  ```

---

## 📊 Summary of Best Practices

1. **Always use Docker Compose V2 syntax:** `docker compose ...` (no hyphen).
2. **Execute commands inside services by service name:** `docker compose exec postgres ...` (do not rely on hardcoded container IDs).
3. **Keep secrets out of images:** Pass tokens and secrets at runtime via `.env`.
