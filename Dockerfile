# ==============================================================================
# Tembot Platform Production Multi-Stage Dockerfile
# Target: Node.js 24 Alpine + pnpm + Non-root execution
# ==============================================================================

FROM node:24-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.5.2 --activate
WORKDIR /app

# Stage 2: Dependencies and Build
FROM base AS builder
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json tsconfig.base.json biome.json ./
COPY packages/ ./packages/
COPY modules/ ./modules/
COPY tooling/ ./tooling/
COPY apps/ ./apps/

RUN pnpm install --frozen-lockfile
RUN pnpm build

# Stage 3: Minimal Production Runner
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Security: Run as unprivileged non-root user
RUN addgroup --system --gid 10001 tembot && \
    adduser --system --uid 10001 -G tembot tembot

COPY --from=builder --chown=tembot:tembot /app ./

USER tembot
EXPOSE 4000

CMD ["node", "apps/server/dist/index.js"]
