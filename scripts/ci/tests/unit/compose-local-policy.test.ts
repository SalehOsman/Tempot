import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const composePath = join(process.cwd(), 'docker-compose.yml');

function serviceBlock(compose: string, serviceName: string): string {
  const pattern = new RegExp(`^  ${serviceName}:\\n(?<body>(?:    .+\\n|\\s*\\n)+)`, 'mu');
  const match = compose.match(pattern);
  expect(match?.groups?.['body']).toBeDefined();
  return match?.groups?.['body'] ?? '';
}

describe('docker compose local-only policy', () => {
  it('binds only externally required service ports to loopback', () => {
    const compose = readFileSync(composePath, 'utf8');

    expect(serviceBlock(compose, 'bot-server')).toContain("'127.0.0.1:3000:3000'");
    expect(serviceBlock(compose, 'postgres')).toContain("'127.0.0.1:5432:5432'");
    expect(serviceBlock(compose, 'redis')).not.toContain('ports:');
    expect(serviceBlock(compose, 'redis')).not.toContain("'127.0.0.1:6379:6379'");
    expect(compose).not.toMatch(/-\s*['"]?(?:3000|5432|6379):(?:3000|5432|6379)['"]?/u);
    expect(compose).not.toContain('0.0.0.0:');
  });

  it('uses the public liveness route for the local bot healthcheck', () => {
    const compose = readFileSync(composePath, 'utf8');

    expect(serviceBlock(compose, 'bot-server')).toContain('http://localhost:3000/live');
    expect(serviceBlock(compose, 'bot-server')).not.toContain('http://localhost:3000/ready');
  });

  it('applies database migrations before starting the local bot container', () => {
    const compose = readFileSync(composePath, 'utf8');
    const botServer = serviceBlock(compose, 'bot-server');

    expect(botServer).toContain('prisma migrate deploy');
    expect(botServer).toContain('node dist/index.js');
  });
});
