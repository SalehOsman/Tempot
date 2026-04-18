import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildHealthProbes } from '../../src/startup/health.probes.js';

// Mock node:fs/promises for disk probe
vi.mock('node:fs/promises', () => ({
  default: {
    statfs: vi.fn(),
  },
}));

import fs from 'node:fs/promises';

function makePrisma(overrides: Partial<{ $queryRaw: () => Promise<unknown> }> = {}) {
  return {
    $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
    ...overrides,
  };
}

function makeCache(overrides: Partial<{ get: () => Promise<unknown> }> = {}) {
  return {
    get: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('buildHealthProbes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('database probe', () => {
    it('returns ok when prisma.$queryRaw succeeds', async () => {
      const probes = buildHealthProbes({ prisma: makePrisma(), cache: makeCache() });

      const result = await probes.database();

      expect(result.status).toBe('ok');
    });

    it('returns error when prisma.$queryRaw throws', async () => {
      const prisma = makePrisma({
        $queryRaw: vi.fn().mockRejectedValue(new Error('connection refused')),
      });
      const probes = buildHealthProbes({ prisma, cache: makeCache() });

      const result = await probes.database();

      expect(result.status).toBe('error');
      expect(result.error).toContain('connection refused');
    });
  });

  describe('redis probe', () => {
    it('returns ok when cache.get succeeds', async () => {
      const probes = buildHealthProbes({ prisma: makePrisma(), cache: makeCache() });

      const result = await probes.redis();

      expect(result.status).toBe('ok');
    });

    it('returns error when cache.get throws', async () => {
      const cache = makeCache({
        get: vi.fn().mockRejectedValue(new Error('ECONNREFUSED')),
      });
      const probes = buildHealthProbes({ prisma: makePrisma(), cache });

      const result = await probes.redis();

      expect(result.status).toBe('error');
      expect(result.error).toContain('ECONNREFUSED');
    });
  });

  describe('disk probe', () => {
    it('returns ok when free space is above threshold', async () => {
      vi.mocked(fs.statfs).mockResolvedValue({
        bfree: 1_000_000,
        bsize: 4096,
      } as never);
      const probes = buildHealthProbes({ prisma: makePrisma(), cache: makeCache(), diskPath: '/' });

      const result = await probes.disk();

      expect(result.status).toBe('ok');
    });

    it('returns degraded when free space is below 500 MB', async () => {
      // 100 blocks * 4096 bytes = 409_600 bytes < 500 MB
      vi.mocked(fs.statfs).mockResolvedValue({
        bfree: 100,
        bsize: 4096,
      } as never);
      const probes = buildHealthProbes({ prisma: makePrisma(), cache: makeCache(), diskPath: '/' });

      const result = await probes.disk();

      expect(result.status).toBe('degraded');
      expect(result.error).toContain('Low disk space');
    });

    it('returns error when statfs throws', async () => {
      vi.mocked(fs.statfs).mockRejectedValue(new Error('ENOENT'));
      const probes = buildHealthProbes({
        prisma: makePrisma(),
        cache: makeCache(),
        diskPath: '/bad',
      });

      const result = await probes.disk();

      expect(result.status).toBe('error');
    });
  });

  describe('queue_manager probe', () => {
    it('returns ok when no queueFactory provided', async () => {
      const probes = buildHealthProbes({ prisma: makePrisma(), cache: makeCache() });

      const result = await probes.queue_manager();

      expect(result.status).toBe('ok');
    });

    it('returns ok when queueFactory.ping succeeds', async () => {
      const queueFactory = { ping: vi.fn().mockResolvedValue(undefined) };
      const probes = buildHealthProbes({ prisma: makePrisma(), cache: makeCache(), queueFactory });

      const result = await probes.queue_manager();

      expect(result.status).toBe('ok');
    });

    it('returns error when queueFactory.ping throws', async () => {
      const queueFactory = { ping: vi.fn().mockRejectedValue(new Error('queue down')) };
      const probes = buildHealthProbes({ prisma: makePrisma(), cache: makeCache(), queueFactory });

      const result = await probes.queue_manager();

      expect(result.status).toBe('error');
    });
  });

  describe('ai_provider probe', () => {
    it('returns ok when no aiProvider provided', async () => {
      const probes = buildHealthProbes({ prisma: makePrisma(), cache: makeCache() });

      const result = await probes.ai_provider();

      expect(result.status).toBe('ok');
    });

    it('returns ok when aiProvider.ping succeeds', async () => {
      const aiProvider = { ping: vi.fn().mockResolvedValue(undefined) };
      const probes = buildHealthProbes({ prisma: makePrisma(), cache: makeCache(), aiProvider });

      const result = await probes.ai_provider();

      expect(result.status).toBe('ok');
    });

    it('returns degraded when aiProvider.ping throws', async () => {
      const aiProvider = { ping: vi.fn().mockRejectedValue(new Error('model offline')) };
      const probes = buildHealthProbes({ prisma: makePrisma(), cache: makeCache(), aiProvider });

      const result = await probes.ai_provider();

      expect(result.status).toBe('degraded');
      expect(result.error).toContain('model offline');
    });
  });
});
