FROM node:22-alpine AS builder
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/tma ./apps/tma

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @tembot/app-tma build

FROM nginx:alpine
COPY apps/tma/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/tma/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
