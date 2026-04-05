# Testing Strategy — Extended Guide

> Reference: Spec v11, Section 24 — Constitution Rules XXXIV–XXXVIII

---

## Test Pyramid Summary

| Level | Tool | Target | Enforcement |
|-------|------|--------|-------------|
| Unit (70%) | Vitest | Services, Handlers, Utilities | Build fails below threshold |
| Integration (20%) | Vitest + Testcontainers | Service + DB + Redis together | Build fails below threshold |
| E2E (10%) | Vitest + grammY Test | Critical user flows | Advisory |

---

## TDD Workflow (Mandatory)

Every task follows RED → GREEN → REFACTOR:

```bash
# 1. RED — write the failing test
pnpm test:unit packages/logger/tests/unit/logger.service.test.ts
# Expected: FAIL (implementation doesn't exist)

# 2. GREEN — write minimal code to pass
# (implement the feature)
pnpm test:unit packages/logger/tests/unit/logger.service.test.ts
# Expected: PASS

# 3. REFACTOR — clean up without changing behaviour
pnpm test:unit packages/logger/tests/unit/logger.service.test.ts
# Expected: PASS (still)
```

Tests written after implementation are not accepted (Constitution Rule XXXIV).

---

## Unit Testing

### Test File Naming

```
packages/{name}/tests/unit/{Feature}.{type}.test.ts
modules/{name}/tests/unit/{feature}/{Feature}.{type}.test.ts
```

### Test Structure

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoggerService } from '../../src/logger.service';

describe('LoggerService', () => {
  let logger: LoggerService;

  beforeEach(() => {
    logger = new LoggerService({ level: 'info' });
  });

  it('should log at INFO level when level is info', () => {
    const spy = vi.spyOn(logger['pino'], 'info');
    logger.info('test message');
    expect(spy).toHaveBeenCalledWith('test message');
  });

  it('should not log DEBUG when level is info', () => {
    const spy = vi.spyOn(logger['pino'], 'debug');
    logger.debug('debug message');
    expect(spy).not.toHaveBeenCalled();
  });

  it('should set loggedAt flag on AppError when logging error', () => {
    const error = new AppError('test.error');
    logger.error(error);
    expect(error.loggedAt).toBe(true);
  });
});
```

### Mocking External Services

All external services must be mocked in unit tests:

```typescript
// Mock AI provider
vi.mock('@tempot/ai-core', () => ({
  aiCore: {
    embed: vi.fn().mockResolvedValue(ok(new Array(1536).fill(0.1))),
    classify: vi.fn().mockResolvedValue(ok({ label: 'invoice', confidence: 0.95 })),
  },
}));

// Mock storage
vi.mock('@tempot/storage-engine', () => ({
  storageEngine: {
    upload: vi.fn().mockResolvedValue(ok({ url: 'https://example.com/file.pdf' })),
  },
}));

// Mock notifier
vi.mock('@tempot/notifier', () => ({
  notifier: {
    send: vi.fn().mockResolvedValue(ok(undefined)),
  },
}));
```

### Coverage Requirements

```typescript
// vitest.config.base.ts — enforced thresholds
thresholds: {
  // Services: 80% (build fails)
  // Handlers: 70% (build fails)
  // Repositories: 60% (warning only)
  // Conversations: 50% (warning only)
}
```

Run coverage report:

```bash
pnpm test:coverage
# Opens HTML report at coverage/index.html
```

---

## Integration Testing

### Testcontainers Setup

Every integration test suite uses the shared `TestDB` utility:

```typescript
// packages/database/tests/utils/test-db.ts
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { RedisContainer } from '@testcontainers/redis';

export class TestDB {
  private pgContainer!: StartedPostgreSqlContainer;
  private redisContainer!: StartedRedisContainer;
  public prisma!: PrismaClient;
  public redis!: Redis;

  async start() {
    // Start containers in parallel
    [this.pgContainer, this.redisContainer] = await Promise.all([
      new PostgreSqlContainer('ankane/pgvector:latest').start(),
      new RedisContainer('redis:7-alpine').start(),
    ]);

    process.env.DATABASE_URL = this.pgContainer.getConnectionUri();
    process.env.REDIS_URL = `redis://${this.redisContainer.getHost()}:${this.redisContainer.getMappedPort(6379)}`;

    // Run migrations
    execSync('pnpm prisma migrate deploy', { env: process.env });

    this.prisma = new PrismaClient();
    this.redis = new Redis(process.env.REDIS_URL);
  }

  async stop() {
    await this.redis.quit();
    await this.prisma.$disconnect();
    await Promise.all([
      this.pgContainer.stop(),
      this.redisContainer.stop(),
    ]);
  }

  async reset() {
    // Truncate all tables between tests
    await this.prisma.$executeRaw`TRUNCATE TABLE ... CASCADE`;
  }
}
```

### Integration Test Example

```typescript
describe('InvoiceService — integration', () => {
  const testDb = new TestDB();

  beforeAll(async () => await testDb.start());
  afterAll(async () => await testDb.stop());
  afterEach(async () => await testDb.reset());

  it('should create invoice and emit event', async () => {
    const eventBus = new TestEventBus(); // captures emitted events
    const service = new InvoiceService(
      new InvoiceRepository(testDb.prisma),
      eventBus,
    );

    const result = await service.create({
      customerId: 'user-1',
      amount: 1500,
    });

    expect(result.isOk()).toBe(true);
    expect(result.value.amount).toBe(1500);
    expect(eventBus.emitted).toContainEqual(
      expect.objectContaining({ eventName: 'invoices.invoice.created' })
    );

    // Verify persisted in DB
    const dbRecord = await testDb.prisma.invoice.findUnique({
      where: { id: result.value.id },
    });
    expect(dbRecord).not.toBeNull();
    expect(dbRecord!.isDeleted).toBe(false);
  });
});
```

---

## E2E Testing

### grammY Test Setup

```typescript
import { Bot } from 'grammy';
import { TestAdapter } from '@grammyjs/test'; // official test adapter

describe('Invoice creation flow — E2E', () => {
  let bot: Bot;
  let adapter: TestAdapter;

  beforeAll(async () => {
    bot = createBot(); // full bot with all middleware
    adapter = new TestAdapter(bot);
  });

  it('should complete invoice creation conversation', async () => {
    const chat = adapter.chat();

    // User starts the flow
    await chat.send('/start');
    expect(chat.last).toMatchText(/مرحباً/);

    await chat.send('/create_invoice');
    expect(chat.last).toMatchText(/أدخل اسم العميل/);

    await chat.send('أحمد محمد');
    expect(chat.last).toMatchText(/أدخل المبلغ/);

    await chat.send('1500');
    expect(chat.last).toMatchText(/تم إنشاء الفاتورة بنجاح/);
  });
});
```

---

## Performance Testing

For high-traffic scenarios, use k6:

```javascript
// tests/performance/bot-webhook.k6.js
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 100,           // 100 virtual users
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<200'], // 95% of requests under 200ms
    http_req_failed: ['rate<0.01'],   // Less than 1% errors
  },
};

export default function () {
  const res = http.post(
    `${__ENV.WEBHOOK_URL}/webhook`,
    JSON.stringify(mockTelegramUpdate()),
    { headers: { 'Content-Type': 'application/json' } },
  );
  check(res, { 'status is 200': (r) => r.status === 200 });
}
```

---

## Chaos Testing

Test Redis and PostgreSQL failure scenarios:

```typescript
describe('Redis failure resilience', () => {
  it('should fall back to DB sessions when Redis is unavailable', async () => {
    // Simulate Redis failure
    await testDb.redis.disconnect();

    // Bot should still respond (using DB fallback)
    const result = await sessionManager.getSession('user-123');
    expect(result.isOk()).toBe(true);

    // Alert should have been sent to SUPER_ADMIN
    expect(notifierMock.send).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'redis_failure' })
    );
  });
});
```

---

## CI/CD Integration

Tests run automatically on every PR via GitHub Actions:

```yaml
# .github/workflows/test.yml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: pnpm install
      - run: pnpm test:unit
      - run: pnpm test:integration
      - run: pnpm test:coverage
      - run: pnpm cms:check
      - run: pnpm lint
```

The build fails if:
- Any test fails
- Coverage drops below thresholds (Services 80%, Handlers 70%)
- `pnpm cms:check` reports missing translations
- `pnpm lint` reports errors
