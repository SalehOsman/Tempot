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

ARG PNPM_VERSION=10.33.3

FROM node:22.12-alpine AS base
ARG PNPM_VERSION
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
# Prisma library engine requires openssl + libc compat on Alpine
RUN apk add --no-cache openssl libc6-compat
RUN npm install -g "pnpm@${PNPM_VERSION}"

# ---------------------------------------------------------------------------
# Stage: builder
# ---------------------------------------------------------------------------
FROM base AS builder
WORKDIR /app

# Optional native bindings such as ssh2 and cpu-features compile during install.
# Keep build tools in the builder stage only; the runner image stays minimal.
RUN apk add --no-cache python3 make g++

COPY . .

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# (1) Generate Prisma Client so tsc can resolve the generated types at build time
RUN pnpm --filter @tempot/database exec prisma generate

# Build the bot runtime only. The docs app is intentionally excluded from the
# bot image, because Starlight content links are local-development concerns.
RUN pnpm build:bot-runtime

# Deploy bot-server as an isolated production bundle.
# Creates a fresh pnpm virtual store in /app/out — the .prisma/client binary
# from step (1) is NOT carried over automatically.
RUN pnpm deploy --filter bot-server --prod --legacy /app/out

# (2) Re-generate Prisma Client inside /app/out's pnpm virtual store.
#
#     `pnpm deploy --legacy --prod` creates a flat node_modules layout.
#     @tempot/database lands at the predictable path below, so no `find`
#     is needed. We cd into it so Node.js module resolution follows
#     /app/out's symlinks and places .prisma/client at the correct path.
#
#     We set PRISMA_SCHEMA_PATH explicitly so Prisma locates schema.prisma
#     inside the deployed package (pnpm deploy copies the `prisma/` dir
#     because it is listed in @tempot/database `files`).
#
#     pnpm deploy --legacy does not hoist prisma to /app/out/node_modules/prisma.
#     The CLI is exposed through the deploy virtual store's internal .bin path.
RUN cd /app/out/node_modules/@tempot/database \
    && PRISMA_SCHEMA_PATH=/app/out/node_modules/@tempot/database/prisma/schema.prisma \
       /app/out/node_modules/.pnpm/node_modules/.bin/prisma generate

# ---------------------------------------------------------------------------
# Stage: runner — minimal production image
# ---------------------------------------------------------------------------
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy built files from bot-server
COPY --from=builder /app/apps/bot-server/dist ./dist

# Copy dependencies from pnpm deploy
COPY --from=builder /app/out/node_modules ./node_modules

# Copy all built workspace packages (for module-specific dependencies).
# Modules declare needs in module.config.ts requires; the validator checks packages/.
COPY --from=builder /app/packages ./packages

# Create node_modules symlinks for workspace packages not already provided by
# pnpm deploy. Packages that pnpm deploy already placed (database, auth-core, etc.)
# are skipped — only module-specific packages (e.g. national-id-parser) get linked.
RUN mkdir -p node_modules/@tempot && \
    for dir in packages/*/; do \
      name=$(basename "$dir"); \
      [ ! -e "node_modules/@tempot/$name" ] && [ -d "$dir" ] && \
        ln -sf "../../packages/$name" "node_modules/@tempot/$name" || true; \
    done

# Copy Prisma schema files (needed for runtime database operations)
COPY --from=builder /app/packages/database/prisma ./prisma-schemas/database/

# Copy modules from workspace root (modules/*). Each module contains both
# source .ts files (for validator MANDATORY_PATHS checks) and compiled dist/
# (for module-discovery and Node dynamic import at runtime).
COPY --from=builder /app/modules ./modules

# Copy specs/ so the ModuleValidator spec-gate check (specsDir = /app/specs) passes.
# Without this, every module fails validation with "No spec directory found".
COPY --from=builder /app/specs ./specs

# Copy bot-server locale files for core messages like rate_limit_exceeded
COPY --from=builder /app/apps/bot-server/locales ./apps/bot-server/locales

# Create non-root user (Constitution Rule X)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 hono --ingroup nodejs
USER hono

EXPOSE 3000
CMD ["node", "dist/index.js"]
