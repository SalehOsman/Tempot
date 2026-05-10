# Performance and Scaling Guide

> Reference: Spec v11, Section 26.4

---

## Performance Thresholds

| Service          | Normal  | Alert Threshold | Action                                   |
| ---------------- | ------- | --------------- | ---------------------------------------- |
| Database query   | < 100ms | > 500ms         | Investigate query, add index             |
| Redis operation  | < 10ms  | > 100ms         | Check Redis memory, connection pool      |
| AI Provider call | < 2s    | > 10s           | Check circuit breaker, enable queue mode |
| Error rate       | < 1%    | > 5%            | Immediate investigation                  |
| Memory usage     | < 70%   | > 90%           | Scale horizontally or increase limits    |

All thresholds are monitored via the `/health` endpoint and Sentry alerts.

---

## Database Optimisation

### Connection Pooling

```typescript
// packages/database/src/prisma/client.ts
export const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL },
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
}).$extends(softDeleteExtension);

// Connection pool configuration (via DATABASE_URL)
// postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=10
```

Recommended pool sizes:

- Development: `connection_limit=5`
- Production (single instance): `connection_limit=10`
- Production (multiple instances): `connection_limit=5` per instance

### Query Optimisation

Always check slow queries first:

```sql
-- Find slow queries (PostgreSQL)
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;
```

Common optimisations:

```typescript
// ❌ N+1 problem
const invoices = await prisma.invoice.findMany();
for (const invoice of invoices) {
  const customer = await prisma.user.findUnique({ where: { id: invoice.userId } });
}

// ✅ Use include
const invoices = await prisma.invoice.findMany({
  include: { customer: true },
});
```

### Index Strategy

```prisma
model Invoice {
  id         String   @id @default(cuid())
  userId     String
  status     String
  createdAt  DateTime @default(now())
  isDeleted  Boolean  @default(false)

  // Compound index for most common query
  @@index([userId, isDeleted, createdAt(sort: Desc)])
  // Status filtering
  @@index([status, isDeleted])
}
```

---

## Redis Optimisation

### Memory Management

```bash
# Check Redis memory usage
docker exec tempot-redis redis-cli info memory | grep used_memory_human

# Set memory limit in docker-compose.yml
redis:
  deploy:
    resources:
      limits:
        memory: 512M
  command: redis-server --maxmemory 400mb --maxmemory-policy allkeys-lru
```

### Key Expiry Strategy

All cache keys must have explicit TTLs (Constitution Rule XIX):

| Key pattern                | TTL        | Reason                  |
| -------------------------- | ---------- | ----------------------- |
| `session:{userId}`         | 30 minutes | Active session window   |
| `settings:{key}`           | 5 minutes  | Settings rarely change  |
| `translation:{key}:{lang}` | 1 hour     | CMS cache               |
| `search:{userId}:{query}`  | 30 minutes | Search state            |
| `ai:embed:{hash}`          | 24 hours   | Expensive to regenerate |

---

## BullMQ Tuning

### Worker Concurrency

```typescript
// packages/shared/queue.factory.ts
export function createWorker(queueName: string, processor: Processor) {
  return new Worker(queueName, processor, {
    connection: redis,
    concurrency: getWorkerConcurrency(queueName),
  });
}

function getWorkerConcurrency(queueName: string): number {
  const concurrencyMap: Record<string, number> = {
    notifications: 10, // High throughput, lightweight
    'document-generation': 3, // CPU-intensive PDF/Excel generation
    'ai-embedding': 5, // Rate-limited by AI provider
    'import-processing': 2, // Memory-intensive for large files
  };
  return concurrencyMap[queueName] ?? 5;
}
```

### Job Retry Strategy

```typescript
const defaultJobOptions: DefaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000, // 2s, 4s, 8s
  },
  removeOnComplete: { count: 100 }, // Keep last 100 completed
  removeOnFail: { count: 500 }, // Keep last 500 failed for inspection
};
```

---

## Horizontal Scaling

When a single bot-server instance is insufficient:

### Prerequisites

- All state must be in Redis or PostgreSQL (no in-memory state between requests)
- Webhook mode required (polling cannot be distributed)
- BullMQ uses Redis for queue coordination — works natively across instances

### Configuration

```yaml
# docker-compose.prod.yml (multiple bot instances)
services:
  bot-server-1:
    build: ./apps/bot-server
    environment:
      - INSTANCE_ID=1
    depends_on:
      postgres: { condition: service_healthy }
      redis: { condition: service_healthy }

  bot-server-2:
    build: ./apps/bot-server
    environment:
      - INSTANCE_ID=2
    depends_on:
      postgres: { condition: service_healthy }
      redis: { condition: service_healthy }

  nginx:
    image: nginx:alpine
    # Load balance between bot-server-1 and bot-server-2
    # Telegram webhook sends to a single URL — nginx distributes
```

### Telegram Webhook Constraint

Telegram sends all updates to a single webhook URL. Use a load balancer (nginx, Cloudflare) to distribute incoming webhook requests across multiple bot instances.

---

## Cache Tuning

### Multi-tier Cache Configuration

```typescript
// packages/shared/cache.ts
import { createCache } from 'cache-manager';
import KeyvRedis from '@keyv/redis';
import KeyvPostgres from '@keyv/postgres';

export const cache = createCache({
  stores: [
    // L1: In-memory (fastest, lost on restart)
    new Keyv({ store: new KeyvMap(), ttl: 60_000 }), // 1 minute
    // L2: Redis (fast, survives restarts)
    new Keyv({ store: new KeyvRedis(process.env.REDIS_URL), ttl: 3_600_000 }), // 1 hour
    // L3: PostgreSQL (slow, permanent fallback)
    new Keyv({ store: new KeyvPostgres(process.env.DATABASE_URL), ttl: 86_400_000 }), // 24 hours
  ],
});
```

### Cache Warming

For settings and translations, warm the cache on startup:

```typescript
// apps/bot-server/src/startup/cache-warmer.ts
export async function warmCache() {
  // Load all active settings into cache
  const settings = await prisma.setting.findMany({ where: { isActive: true } });
  await Promise.all(settings.map((s) => cache.set(`settings:${s.key}`, s.value)));

  // Load default language translations
  await cmsEngine.warmTranslations(['ar', 'en']);

  logger.info(`Cache warmed: ${settings.length} settings loaded`);
}
```
