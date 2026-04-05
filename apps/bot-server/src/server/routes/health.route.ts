import { Hono } from 'hono';
import type { Context as HonoContext } from 'hono';
import type { HealthCheckResponse, ModuleLogger, SubsystemCheck } from '../../bot-server.types.js';

type SubsystemProbe = () => Promise<SubsystemCheck>;

interface HealthProbes {
  database: SubsystemProbe;
  redis: SubsystemProbe;
  ai_provider: SubsystemProbe;
  disk: SubsystemProbe;
  queue_manager: SubsystemProbe;
}

interface HealthRouteDeps {
  probes: HealthProbes;
  version: string;
  startTime: number;
  logger: ModuleLogger;
}

const PROBE_TIMEOUT_MS = 4_000;

/** Subsystems whose failure means "unhealthy" (critical) */
const CRITICAL_SUBSYSTEMS = new Set(['database', 'redis']);

/** Subsystems whose failure means "degraded" (non-critical) */
const DEGRADED_SUBSYSTEMS = new Set(['ai_provider', 'disk']);

export function createHealthRoute(deps: HealthRouteDeps): Hono {
  const route = new Hono();
  const { probes, version, startTime, logger } = deps;

  route.get('/health', async (c: HonoContext) => {
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

  try {
    return await Promise.race([probe(), timeoutPromise]);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error({ msg: 'health_probe_failed', subsystem: name, error: message });
    return { status: 'error', error: message };
  }
}

function classifyHealth(checks: ChecksRecord): HealthCheckResponse['status'] {
  let degraded = false;

  for (const [name, check] of Object.entries(checks)) {
    if (check.status === 'error') {
      if (CRITICAL_SUBSYSTEMS.has(name)) {
        return 'unhealthy';
      }
      if (DEGRADED_SUBSYSTEMS.has(name)) {
        degraded = true;
      }
    }
  }

  return degraded ? 'degraded' : 'healthy';
}
