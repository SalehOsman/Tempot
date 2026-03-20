# =============================================================================
# Tempot Bot Server — Dockerfile
# Phase 5: To be completed after all packages are built
# =============================================================================
#
# TODO: Implement after Phase 1-4 packages are complete
#
# Build stages needed:
#   1. base    — Node.js 20 Alpine + pnpm
#   2. deps    — Install production dependencies only
#   3. builder — TypeScript compilation
#   4. runner  — Final minimal image
#
# Example structure (to be implemented in Phase 5):
#
# FROM node:20-alpine AS base
# RUN corepack enable pnpm
#
# FROM base AS deps
# WORKDIR /app
# COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# COPY apps/bot-server/package.json ./apps/bot-server/
# COPY packages/*/package.json ./packages/*/
# RUN pnpm install --frozen-lockfile --prod
#
# FROM base AS builder
# WORKDIR /app
# COPY . .
# RUN pnpm install --frozen-lockfile
# RUN pnpm --filter bot-server build
#
# FROM base AS runner
# WORKDIR /app
# ENV NODE_ENV=production
# COPY --from=deps /app/node_modules ./node_modules
# COPY --from=builder /app/apps/bot-server/dist ./apps/bot-server/dist
# COPY --from=builder /app/packages/*/dist ./packages/*/dist
# EXPOSE 3000
# CMD ["node", "apps/bot-server/dist/index.js"]
