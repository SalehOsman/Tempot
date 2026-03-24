import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('getPrismaClient', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should throw FATAL error when DATABASE_URL is undefined', async () => {
    vi.stubEnv('DATABASE_URL', '');
    // Delete DATABASE_URL entirely to simulate missing env var
    delete process.env.DATABASE_URL;

    const { prisma } = await import('../../src/prisma/client.js');

    expect(() => {
      // Accessing any property on the proxy triggers getPrismaClient()
      void prisma.$connect;
    }).toThrow(/FATAL/);

    expect(() => {
      void prisma.$connect;
    }).toThrow(/DATABASE_URL/);

    vi.unstubAllEnvs();
  });

  it('should not throw when DATABASE_URL is set', async () => {
    vi.stubEnv('DATABASE_URL', 'postgresql://test:test@localhost:5432/test');

    const { prisma } = await import('../../src/prisma/client.js');

    expect(() => {
      // Accessing a property should not throw
      void prisma.$connect;
    }).not.toThrow();

    vi.unstubAllEnvs();
  });
});
