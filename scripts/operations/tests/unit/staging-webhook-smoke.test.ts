import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { runStagingWebhookSmoke, type HttpFetcher } from '../../staging-webhook-smoke.js';

interface FetchCall {
  url: string;
  method: string;
  headers: Headers;
}

describe('runStagingWebhookSmoke', () => {
  it('checks liveness, readiness, and webhook and writes release evidence', async () => {
    const calls: FetchCall[] = [];
    const fetcher = fakeFetcher(calls, 200);
    const evidencePath = path.join(
      mkdtempSync(path.join(tmpdir(), 'tempot-smoke-')),
      'evidence.md',
    );

    const result = await runStagingWebhookSmoke({
      baseUrl: 'https://staging.example.com',
      webhookSecret: 'secret',
      readinessToken: 'ready',
      evidencePath,
      fetcher,
    });

    expect(result.passed).toBe(true);
    expect(calls.map((call) => call.url)).toEqual([
      'https://staging.example.com/live',
      'https://staging.example.com/ready',
      'https://staging.example.com/webhook',
    ]);
    expect(calls[1]?.headers.get('x-tempot-readiness-token')).toBe('ready');
    expect(calls[2]?.headers.get('x-telegram-bot-api-secret-token')).toBe('secret');
    expect(readFileSync(evidencePath, 'utf8')).toContain('- Result: PASS');
  });

  it('fails the result when any staging check returns an unexpected status', async () => {
    const fetcher = fakeFetcher([], 503);

    const result = await runStagingWebhookSmoke({
      baseUrl: 'https://staging.example.com/',
      webhookSecret: 'secret',
      readinessToken: 'ready',
      fetcher,
    });

    expect(result.passed).toBe(false);
    expect(result.checks).toEqual(
      expect.arrayContaining([expect.objectContaining({ actualStatus: 503 })]),
    );
  });
});

function fakeFetcher(calls: FetchCall[], status: number): HttpFetcher {
  return async (url, init) => {
    calls.push({
      url,
      method: init?.method ?? 'GET',
      headers: new Headers(init?.headers),
    });
    return new Response(JSON.stringify({ ok: status === 200 }), { status });
  };
}
