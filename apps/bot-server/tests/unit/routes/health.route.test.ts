import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { createHealthRoute } from '../../../src/server/routes/health.route.js';
import type {
  HealthCheckResponse,
  ModuleLogger,
  SubsystemCheck,
} from '../../../src/bot-server.types.js';

function createMockLogger(): ModuleLogger {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn().mockReturnThis(),
  };
}

interface HealthProbes {
  database: () => Promise<SubsystemCheck>;
  redis: () => Promise<SubsystemCheck>;
  ai_provider: () => Promise<SubsystemCheck>;
  disk: () => Promise<SubsystemCheck>;
  queue_manager: () => Promise<SubsystemCheck>;
}

interface HealthRouteDeps {
  probes: HealthProbes;
  version: string;
  startTime: number;
  logger: ModuleLogger;
}

function okCheck(latency = 5): SubsystemCheck {
  return { status: 'ok', latency_ms: latency };
}

function errorCheck(error: string): SubsystemCheck {
  return { status: 'error', error };
}

function createAllOkProbes(): HealthProbes {
  return {
    database: vi.fn().mockResolvedValue(okCheck(2)),
    redis: vi.fn().mockResolvedValue(okCheck(1)),
    ai_provider: vi.fn().mockResolvedValue(okCheck(10)),
    disk: vi.fn().mockResolvedValue(okCheck(3)),
    queue_manager: vi.fn().mockResolvedValue(okCheck(1)),
  };
}

function createTestApp(deps: HealthRouteDeps): Hono {
  const app = new Hono();
  const route = createHealthRoute({
    probes: deps.probes,
    version: deps.version,
    startTime: deps.startTime,
    logger: deps.logger,
  });
  app.route('/', route);
  return app;
}

describe('createHealthRoute', () => {
  let deps: HealthRouteDeps;

  beforeEach(() => {
    deps = {
      probes: createAllOkProbes(),
      version: '1.0.0',
      startTime: Date.now() - 60_000,
      logger: createMockLogger(),
    };
  });

  it('returns healthy when all subsystems are ok', async () => {
    const app = createTestApp(deps);

    const response = await app.request('/health');
    const body = (await response.json()) as HealthCheckResponse;

    expect(response.status).toBe(200);
    expect(body.status).toBe('healthy');
    expect(body.checks.database.status).toBe('ok');
    expect(body.checks.redis.status).toBe('ok');
    expect(body.checks.ai_provider.status).toBe('ok');
    expect(body.checks.disk.status).toBe('ok');
    expect(body.checks.queue_manager.status).toBe('ok');
  });

  it('returns unhealthy when database is down', async () => {
    deps.probes.database = vi.fn().mockResolvedValue(errorCheck('Connection refused'));
    const app = createTestApp(deps);

    const response = await app.request('/health');
    const body = (await response.json()) as HealthCheckResponse;

    expect(response.status).toBe(503);
    expect(body.status).toBe('unhealthy');
    expect(body.checks.database.status).toBe('error');
    expect(body.checks.database.error).toBe('Connection refused');
  });

  it('returns degraded when ai_provider is down', async () => {
    deps.probes.ai_provider = vi.fn().mockResolvedValue(errorCheck('Provider timeout'));
    const app = createTestApp(deps);

    const response = await app.request('/health');
    const body = (await response.json()) as HealthCheckResponse;

    expect(response.status).toBe(200);
    expect(body.status).toBe('degraded');
    expect(body.checks.ai_provider.status).toBe('error');
  });

  it('includes latency_ms for each subsystem', async () => {
    const app = createTestApp(deps);

    const response = await app.request('/health');
    const body = (await response.json()) as HealthCheckResponse;

    expect(body.checks.database.latency_ms).toBeTypeOf('number');
    expect(body.checks.redis.latency_ms).toBeTypeOf('number');
    expect(body.checks.ai_provider.latency_ms).toBeTypeOf('number');
    expect(body.checks.disk.latency_ms).toBeTypeOf('number');
    expect(body.checks.queue_manager.latency_ms).toBeTypeOf('number');
  });

  it('includes version and uptime', async () => {
    const app = createTestApp(deps);

    const response = await app.request('/health');
    const body = (await response.json()) as HealthCheckResponse;

    expect(body.version).toBe('1.0.0');
    expect(body.uptime).toBeTypeOf('number');
    expect(body.uptime).toBeGreaterThanOrEqual(59);
  });

  it('returns unhealthy when redis is down', async () => {
    deps.probes.redis = vi.fn().mockResolvedValue(errorCheck('Redis connection lost'));
    const app = createTestApp(deps);

    const response = await app.request('/health');
    const body = (await response.json()) as HealthCheckResponse;

    expect(response.status).toBe(503);
    expect(body.status).toBe('unhealthy');
    expect(body.checks.redis.status).toBe('error');
  });

  it('prioritizes unhealthy over degraded', async () => {
    deps.probes.database = vi.fn().mockResolvedValue(errorCheck('DB down'));
    deps.probes.ai_provider = vi.fn().mockResolvedValue(errorCheck('AI down'));
    const app = createTestApp(deps);

    const response = await app.request('/health');
    const body = (await response.json()) as HealthCheckResponse;

    expect(response.status).toBe(503);
    expect(body.status).toBe('unhealthy');
  });

  it('measures latency_ms even when probe does not return it', async () => {
    deps.probes.database = vi.fn().mockResolvedValue({ status: 'ok' });
    const app = createTestApp(deps);

    const response = await app.request('/health');
    const body = (await response.json()) as HealthCheckResponse;

    expect(body.checks.database.status).toBe('ok');
    expect(body.checks.database.latency_ms).toBeTypeOf('number');
    expect(body.checks.database.latency_ms).toBeGreaterThanOrEqual(0);
  });

  it('times out probe after 4 seconds', async () => {
    vi.useFakeTimers();
    deps.probes.database = vi.fn().mockImplementation(
      () => new Promise(() => {}), // never resolves
    );
    const app = createTestApp(deps);

    const requestPromise = app.request('/health');
    await vi.advanceTimersByTimeAsync(4_001);
    const response = await requestPromise;
    const body = (await response.json()) as HealthCheckResponse;

    expect(body.checks.database.status).toBe('error');
    expect(body.checks.database.error).toContain('4000');

    vi.useRealTimers();
  });

  it('returns degraded when queue_manager is down', async () => {
    deps.probes.queue_manager = vi.fn().mockResolvedValue(errorCheck('Queue offline'));
    const app = createTestApp(deps);

    const response = await app.request('/health');
    const body = (await response.json()) as HealthCheckResponse;

    expect(response.status).toBe(200);
    expect(body.status).toBe('degraded');
    expect(body.checks.queue_manager.status).toBe('error');
  });
});
