# =============================================================================
# Tempot Bot Server — Dockerfile
# =============================================================================
# Multi-stage build using pnpm deploy for monorepo packaging.
#
# The Prisma/pnpm deploy challenge (and why two generate calls are needed):
#
#   `pnpm deploy` creates a fresh pnpm virtual store in /app/out. That store's
#   peer-dep hash for @prisma/client differs from the builder's, so the binary
#   generated in step (1) lands at the wrong path and is not in /app/out at all.
#
#   Naive fix — `pnpm --dir /app/out --filter @tempot/database exec prisma generate`
#   — does NOT work: pnpm traverses ABOVE /app/out, finds the workspace root at
#   /app/pnpm-workspace.yaml, and executes in the source package (/app/packages/
#   database), writing generated files back into /app/node_modules (the builder),
#   not into /app/out/node_modules.
#
#   Correct fix: locate @tempot/database directly inside /app/out's pnpm virtual
#   store and `cd` there before running prisma generate. Node.js module resolution
#   then finds @prisma/client through /app/out's peer graph, placing .prisma/client
#   next to @prisma/client in /app/out — exactly where the runner needs it.
#
#   Prerequisite: `prisma` must be a production dep of @tempot/database so that
#   `pnpm deploy --prod` includes it in /app/out.

FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# ---------------------------------------------------------------------------
# Stage: builder
# ---------------------------------------------------------------------------
FROM base AS builder
WORKDIR /app

COPY . .

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# (1) Generate Prisma Client so tsc can resolve the generated types at build time
RUN pnpm --filter @tempot/database exec prisma generate

# Build all workspace dependencies then bot-server
RUN pnpm --filter bot-server... build

# Build modules — they are standalone workspace packages (modules/*) that are
# NOT dependencies of bot-server (dynamically loaded), so they need a separate
# build step. Each module's tsc outputs to its own dist/ directory.
RUN pnpm --filter "@tempot/*-module" build

# Deploy bot-server as an isolated production bundle.
# Creates a fresh pnpm virtual store in /app/out — the .prisma/client binary
# from step (1) is NOT carried over automatically.
RUN pnpm deploy --filter bot-server --prod --legacy /app/out

# (2) Re-generate Prisma Client inside /app/out's pnpm virtual store.
#
#     Strategy: find @tempot/database in /app/out's .pnpm dir (not the source
#     workspace), cd into it, then invoke the prisma CLI found in /app/out's
#     own node_modules. From that CWD, Node.js module resolution follows
#     /app/out's symlinks, placing .prisma/client at the right hash-keyed path.
RUN set -e; \
    \
    DB_PKG=$(find /app/out/node_modules/.pnpm -maxdepth 6 -type d \
      -path "*/node_modules/@tempot/database" 2>/dev/null | head -n1); \
    [ -n "$DB_PKG" ] || { \
      echo "ERROR: @tempot/database not found in /app/out/node_modules/.pnpm"; \
      exit 1; \
    }; \
    \
    PRISMA=$(find /app/out/node_modules/.pnpm -name "index.js" \
      -path "*/node_modules/prisma/build/index.js" 2>/dev/null | head -n1); \
    [ -n "$PRISMA" ] || { \
      echo "ERROR: prisma CLI not found in /app/out — is 'prisma' a prod dep?"; \
      exit 1; \
    }; \
    \
    echo "==> @tempot/database : $DB_PKG"; \
    echo "==> prisma CLI       : $PRISMA"; \
    cd "$DB_PKG" && node "$PRISMA" generate; \
    echo "==> Prisma Client generated into /app/out successfully"

# ---------------------------------------------------------------------------
# Stage: runner — minimal production image
# ---------------------------------------------------------------------------
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# /app/out now contains both the app and the correctly placed .prisma/client
COPY --from=builder /app/out ./

# Copy modules from workspace root (modules/*). Each module contains both
# source .ts files (for validator MANDATORY_PATHS checks) and compiled dist/
# (for module-discovery and Node dynamic import at runtime).
COPY --from=builder /app/modules ./modules

# Copy specs/ so the ModuleValidator spec-gate check (specsDir = /app/specs) passes.
# Without this, every module fails validation with "No spec directory found".
COPY specs ./specs

# Create non-root user (Constitution Rule X)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 hono --ingroup nodejs
USER hono

EXPOSE 3000
CMD ["node", "dist/index.js"]
