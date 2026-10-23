FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY packages ./packages
COPY modules ./modules
COPY apps/server ./apps/server

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @tembot/app-server build

EXPOSE 4000
CMD ["pnpm", "--filter", "@tembot/app-server", "exec", "tsx", "src/index.ts"]
