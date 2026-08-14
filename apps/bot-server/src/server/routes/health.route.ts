import { Hono } from 'hono';
import { timingSafeEqual } from 'node:crypto';
import type { Context as HonoContext } from 'hono';
import type {
  HealthCheckResponse,
  HealthProbes,
  ModuleLogger,
  SubsystemCheck,
  SubsystemProbe,
} from '../../bot-server.types.js';

interface HealthRouteDeps {
  probes: HealthProbes;
  version: string;
  startTime: number;
  logger: ModuleLogger;
  readinessToken?: string;
}

const PROBE_TIMEOUT_MS = 4_000;
const READINESS_TOKEN_HEADER = 'x-tempot-readiness-token';

/** Subsystems whose failure means "unhealthy" (critical) */
const CRITICAL_SUBSYSTEMS = new Set(['database', 'redis']);

/** Subsystems whose failure means "degraded" (non-critical) */
const DEGRADED_SUBSYSTEMS = new Set(['ai_provider', 'disk', 'queue_manager']);

export function createHealthRoute(deps: HealthRouteDeps): Hono {
  const route = new Hono();
  const { probes, version, startTime, logger, readinessToken } = deps;

  route.get('/live', (c: HonoContext) => c.json({ status: 'alive' }, 200));
  route.get('/health', (c: HonoContext) => c.json({ status: 'alive' }, 200));

  route.get('/ready', async (c: HonoContext) => {
    if (!isReadinessAuthorized(c, readinessToken)) {
      return c.json({ error: 'forbidden' }, 403);
    }
    const checks = await runAllProbes(probes, logger);
    const status = classifyHealth(checks);
    const uptime = Math.floor((Date.now() - startTime) / 1_000);

    const response: HealthCheckResponse = {
      status,
      uptime,
      checks,
      version,
    };

    const httpStatus = status === 'unhealthy' ? 503 : 200;
    return c.json(response, httpStatus);
  });

  return route;
}

function isReadinessAuthorized(c: HonoContext, expectedToken: string | undefined): boolean {
  if (!expectedToken) return false;
  const receivedToken = c.req.header(READINESS_TOKEN_HEADER);
  if (!receivedToken) return false;

  const expectedBuffer = Buffer.from(expectedToken, 'utf8');
  const receivedBuffer = Buffer.from(receivedToken, 'utf8');
  if (expectedBuffer.length !== receivedBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

type ChecksRecord = HealthCheckResponse['checks'];
type SubsystemName = keyof ChecksRecord;

async function runAllProbes(probes: HealthProbes, logger: ModuleLogger): Promise<ChecksRecord> {
  const subsystems = Object.keys(probes) as SubsystemName[];
  const probePromises = subsystems.map((name) => runSingleProbe(name, probes[name], logger));

  const results = await Promise.allSettled(probePromises);

  const checks = {} as Record<string, SubsystemCheck>;
  for (let i = 0; i < subsystems.length; i++) {
    const result = results[i];
    checks[subsystems[i]] =
      result.status === 'fulfilled' ? result.value : { status: 'error', error: 'Probe rejected' };
  }

  return checks as ChecksRecord;
}

async function runSingleProbe(
  name: SubsystemName,
  probe: SubsystemProbe,
  logger: ModuleLogger,
): Promise<SubsystemCheck> {
  const timeoutPromise = new Promise<SubsystemCheck>((resolve) => {
    setTimeout(() => {
      resolve({ status: 'error', error: `Probe timeout after ${PROBE_TIMEOUT_MS}ms` });
    }, PROBE_TIMEOUT_MS);
  });

  const start = Date.now();
  try {
    const result = await Promise.race([probe(), timeoutPromise]);
    const latency_ms = Date.now() - start;
    return { ...result, latency_ms };
  } catch (error: unknown) {
    const latency_ms = Date.now() - start;
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error({ msg: 'health_probe_failed', subsystem: name, error: message });
    return { status: 'error', error: message, latency_ms };
  }
}

function classifyHealth(checks: ChecksRecord): HealthCheckResponse['status'] {
  let degraded = false;

  for (const [name, check] of Object.entries(checks)) {
    if (check.status === 'error' || check.status === 'unconfigured') {
      if (CRITICAL_SUBSYSTEMS.has(name)) {
        return 'unhealthy';
      }
      if (DEGRADED_SUBSYSTEMS.has(name)) {
        degraded = true;
      }
    }
    if (check.status === 'degraded' && DEGRADED_SUBSYSTEMS.has(name)) {
      degraded = true;
    }
  }

  return degraded ? 'degraded' : 'healthy';
}
