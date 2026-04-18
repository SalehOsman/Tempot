/**
 * Health Probes: builds the HealthProbes map from real subsystem instances.
 *
 * Each probe returns a SubsystemCheck with status and latency.
 * Probes must resolve; errors are caught and returned as { status: 'error' }.
 *
 * @see specs/020-bot-server/data-model.md — SubsystemProbe, HealthProbes
 */

import fs from 'node:fs/promises';
import type { SubsystemCheck, HealthProbes } from '../bot-server.types.js';

/** Minimum free-disk bytes threshold (500 MB) before flagging as degraded */
const DISK_FREE_THRESHOLD_BYTES = 500 * 1024 * 1024;

interface PrismaProbe {
  $queryRaw: (query: TemplateStringsArray) => Promise<unknown>;
}

interface CacheProbe {
  get: (key: string) => Promise<unknown>;
}

interface QueueProbe {
  ping?: () => Promise<void>;
}

interface AiProbe {
  ping?: () => Promise<void>;
}

export interface ProbeResources {
  prisma: PrismaProbe;
  cache: CacheProbe;
  queueFactory?: QueueProbe;
  aiProvider?: AiProbe;
  /** Directory path to check for disk space (defaults to process.cwd()) */
  diskPath?: string;
}

async function probePrisma(prisma: PrismaProbe): Promise<SubsystemCheck> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'ok' };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return { status: 'error', error: message };
  }
}

async function probeCache(cache: CacheProbe): Promise<SubsystemCheck> {
  try {
    await cache.get('__health_probe__');
    return { status: 'ok' };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return { status: 'error', error: message };
  }
}

async function probeDisk(diskPath: string): Promise<SubsystemCheck> {
  try {
    const stats = await fs.statfs(diskPath);
    const freeBytes = stats.bfree * stats.bsize;
    if (freeBytes < DISK_FREE_THRESHOLD_BYTES) {
      return { status: 'degraded', error: `Low disk space: ${freeBytes} bytes free` };
    }
    return { status: 'ok' };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return { status: 'error', error: message };
  }
}

async function probeQueue(queue: QueueProbe): Promise<SubsystemCheck> {
  try {
    if (queue.ping) await queue.ping();
    return { status: 'ok' };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return { status: 'error', error: message };
  }
}

async function probeAiProvider(ai: AiProbe): Promise<SubsystemCheck> {
  try {
    if (ai.ping) await ai.ping();
    return { status: 'ok' };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return { status: 'degraded', error: message };
  }
}

/**
 * Builds the HealthProbes map from real infrastructure instances.
 * All probe functions are async and resolve (never throw).
 */
export function buildHealthProbes(resources: ProbeResources): HealthProbes {
  const diskPath = resources.diskPath ?? process.cwd();

  return {
    database: () => probePrisma(resources.prisma),
    redis: () => probeCache(resources.cache),
    disk: () => probeDisk(diskPath),
    queue_manager: () =>
      resources.queueFactory
        ? probeQueue(resources.queueFactory)
        : Promise.resolve({ status: 'ok' as const }),
    ai_provider: () =>
      resources.aiProvider
        ? probeAiProvider(resources.aiProvider)
        : Promise.resolve({ status: 'ok' as const }),
  };
}
