# Cloud Deployment Guide

> Reference: Spec v11, Section 25

---

## Overview

Tempot supports deployment on any Node.js-compatible platform. This guide covers the 6 supported deployment targets.

| Platform      | Best For                              | Estimated Cost | Difficulty |
| ------------- | ------------------------------------- | -------------- | ---------- |
| Railway       | Quick start, small-medium bots        | $5–20/month    | Easy       |
| Render        | Medium bots with free tier            | $0–25/month    | Easy       |
| Fly.io        | High performance, global distribution | $10–30/month   | Medium     |
| DigitalOcean  | Full control, managed DB              | $20–50/month   | Medium     |
| AWS           | Enterprise, high scale                | $30+/month     | Hard       |
| VPS (generic) | Any Linux server                      | Variable       | Medium     |

---

## Pre-Deployment Checklist

Before deploying to any platform:

- [ ] `BOT_MODE=webhook` in `.env.production`
- [ ] `WEBHOOK_URL=https://your-domain.com` set
- [ ] `NODE_ENV=production` set
- [ ] All secrets rotated from development values
- [ ] `pnpm test` passes
- [ ] `pnpm build` succeeds locally
- [ ] Backup strategy configured

---

## Railway

Railway is the recommended starting platform — simplest setup, built-in PostgreSQL and Redis.

### Setup Steps

```bash
# 1. Install Railway CLI
npm install -g @railway/cli
railway login

# 2. Create project
railway new tempot

# 3. Add PostgreSQL plugin (with pgvector)
railway add --plugin postgresql

# 4. Add Redis plugin
railway add --plugin redis

# 5. Set environment variables
railway variables set BOT_TOKEN=your-token
railway variables set SUPER_ADMIN_IDS=your-telegram-id
railway variables set BOT_MODE=webhook
railway variables set NODE_ENV=production
# ... set all variables from .env.example

# 6. Deploy
railway up

# 7. Get your domain and set webhook
railway domain  # Copy the URL
railway variables set WEBHOOK_URL=https://your-app.railway.app
pnpm webhook:set
```

### railway.toml

```toml
[build]
builder = "NIXPACKS"
buildCommand = "pnpm install && pnpm build"

[deploy]
startCommand = "node apps/bot-server/dist/index.js"
healthcheckPath = "/health"
healthcheckTimeout = 30
restartPolicyType = "ON_FAILURE"
```

### Cost Estimate

| Component              | Cost           |
| ---------------------- | -------------- |
| Bot server (512MB RAM) | ~$5/month      |
| PostgreSQL (1GB)       | ~$5/month      |
| Redis (256MB)          | ~$3/month      |
| **Total**              | **~$13/month** |

---

## Render

Render offers a free tier suitable for low-traffic bots.

### Setup Steps

1. Create account at [render.com](https://render.com)
2. New → Web Service → Connect GitHub repo
3. Configure:
   - **Build Command:** `pnpm install && pnpm build`
   - **Start Command:** `node apps/bot-server/dist/index.js`
   - **Health Check Path:** `/health`
4. Add Environment Variables (from `.env.example`)
5. Create PostgreSQL and Redis services in Render dashboard
6. Link DATABASE_URL and REDIS_URL from Render-provided connection strings

### render.yaml

```yaml
services:
  - type: web
    name: tempot-bot
    env: node
    buildCommand: pnpm install && pnpm build
    startCommand: node apps/bot-server/dist/index.js
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: BOT_MODE
        value: webhook
      - fromDatabase:
          name: tempot-db
          property: connectionString
        key: DATABASE_URL

databases:
  - name: tempot-db
    plan: starter
```

---

## Fly.io

Best for low-latency deployments with global distribution.

### Setup Steps

```bash
# 1. Install flyctl
curl -L https://fly.io/install.sh | sh
fly auth login

# 2. Launch app
fly launch --name tempot-bot

# 3. Create PostgreSQL (with pgvector)
fly postgres create --name tempot-db --vm-size shared-cpu-1x
fly postgres attach tempot-db

# 4. Create Redis (Upstash)
fly ext redis create --name tempot-redis

# 5. Set secrets
fly secrets set BOT_TOKEN=your-token
fly secrets set SUPER_ADMIN_IDS=your-id
fly secrets set BOT_MODE=webhook

# 6. Deploy
fly deploy

# 7. Set webhook
fly open  # Get URL
fly secrets set WEBHOOK_URL=https://tempot-bot.fly.dev
pnpm webhook:set
```

### fly.toml

```toml
app = "tempot-bot"
primary_region = "cdg"  # Paris — closest to Egypt

[build]
  dockerfile = "apps/bot-server/Dockerfile"

[http_service]
  internal_port = 3000
  force_https = true
  [http_service.concurrency]
    type = "requests"
    hard_limit = 200
    soft_limit = 150

[[vm]]
  memory = "512mb"
  cpu_kind = "shared"
  cpus = 1

[checks]
  [checks.health]
    grace_period = "10s"
    interval = "30s"
    method = "GET"
    path = "/health"
    timeout = "5s"
```

---

## DigitalOcean

Full control with managed database and Redis.

### Setup Steps

1. Create Droplet (Ubuntu 22.04, 2GB RAM minimum)
2. Create Managed PostgreSQL cluster (with pgvector extension enabled)
3. Create Managed Redis cluster
4. SSH into Droplet:

```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install pnpm
corepack enable pnpm

# Clone and setup
git clone https://github.com/SalehOsman/Tempot.git /app
cd /app
pnpm install
cp .env.example .env
# Edit .env with production values

# Build
pnpm build

# Install PM2 for process management
npm install -g pm2

# Start bot
pm2 start apps/bot-server/dist/index.js --name tempot-bot
pm2 startup  # Auto-start on server reboot
pm2 save
```

5. Configure nginx as reverse proxy:

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

6. Set webhook: `pnpm webhook:set`

---

## AWS

For enterprise deployments with high availability requirements.

### Architecture

- **ECS Fargate** — container orchestration (no EC2 management)
- **RDS PostgreSQL** — managed database with pgvector extension
- **ElastiCache Redis** — managed Redis cluster
- **ALB** — Application Load Balancer for webhook endpoint
- **ECR** — Container registry for bot-server image

### Estimated Cost (us-east-1)

| Component                          | Cost           |
| ---------------------------------- | -------------- |
| ECS Fargate (0.5 vCPU, 1GB)        | ~$15/month     |
| RDS PostgreSQL (db.t3.micro)       | ~$15/month     |
| ElastiCache Redis (cache.t3.micro) | ~$12/month     |
| ALB                                | ~$16/month     |
| **Total**                          | **~$58/month** |

See `docs/deployment/CLOUD-DEPLOYMENT-GUIDES/aws-cdk/` for CDK infrastructure code (Phase 5).

---

## Generic VPS

Works on any Linux server (Hetzner, Linode, Vultr, etc.).

### Minimum Requirements

- 1 vCPU, 1GB RAM (2GB recommended)
- Ubuntu 22.04 LTS
- Docker + Docker Compose installed

### Setup

```bash
# Install Docker
curl -fsSL https://get.docker.com | bash

# Clone repository
git clone https://github.com/SalehOsman/Tempot.git /app
cd /app

# Configure environment
cp .env.example .env
# Edit .env with production values including:
# BOT_MODE=webhook
# WEBHOOK_URL=https://your-domain.com
# NODE_ENV=production

# Start all services including bot (Phase 5 — after Dockerfile is complete)
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Set webhook
docker exec tempot-bot pnpm webhook:set
```

---

## Post-Deployment Verification

After any deployment:

```bash
# 1. Health check
curl https://your-domain.com/health
# Expected: { "status": "healthy" }

# 2. Webhook info
pnpm webhook:info
# Expected: webhook URL matches your domain

# 3. Send test message to bot
# /start → should receive welcome message
# /ping → should receive Pong!

# 4. Check Sentry for any startup errors (if TEMPOT_SENTRY=true)
```
