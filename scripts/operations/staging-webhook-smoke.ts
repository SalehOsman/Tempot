import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const TELEGRAM_SECRET_HEADER = 'x-telegram-bot-api-secret-token';
const READINESS_TOKEN_HEADER = 'x-tempot-readiness-token';
const SMOKE_CLIENT_IP_HEADER = 'cf-connecting-ip';
const SMOKE_CLIENT_IP = '203.0.113.10';

export type HttpFetcher = (url: string, init?: RequestInit) => Promise<Response>;

export interface StagingWebhookSmokeInput {
  baseUrl: string;
  webhookSecret: string;
  readinessToken: string;
  evidencePath?: string;
  fetcher?: HttpFetcher;
}

export interface SmokeCheck {
  name: string;
  url: string;
  expectedStatus: number;
  actualStatus: number;
  passed: boolean;
  body: string;
}

export interface StagingWebhookSmokeResult {
  passed: boolean;
  generatedAt: string;
  checks: SmokeCheck[];
  evidencePath?: string;
}

export async function runStagingWebhookSmoke(
  input: StagingWebhookSmokeInput,
): Promise<StagingWebhookSmokeResult> {
  const fetcher = input.fetcher ?? fetch;
  const checks = [
    await getCheck({
      fetcher,
      baseUrl: input.baseUrl,
      route: '/live',
      name: 'liveness',
      headers: {},
    }),
    await getCheck({
      fetcher,
      baseUrl: input.baseUrl,
      route: '/ready',
      name: 'readiness',
      headers: readinessHeaders(input),
    }),
    await webhookCheck(fetcher, input),
  ];
  const result: StagingWebhookSmokeResult = {
    passed: checks.every((check) => check.passed),
    generatedAt: new Date().toISOString(),
    checks,
    evidencePath: input.evidencePath,
  };

  if (input.evidencePath) writeEvidence(input.evidencePath, result);
  return result;
}

interface GetCheckInput {
  fetcher: HttpFetcher;
  baseUrl: string;
  route: string;
  name: string;
  headers: Record<string, string>;
}

async function getCheck(input: GetCheckInput): Promise<SmokeCheck> {
  return executeCheck({
    fetcher: input.fetcher,
    name: input.name,
    url: buildUrl(input.baseUrl, input.route),
    expectedStatus: 200,
    init: { method: 'GET', headers: input.headers },
  });
}

async function webhookCheck(
  fetcher: HttpFetcher,
  input: StagingWebhookSmokeInput,
): Promise<SmokeCheck> {
  return executeCheck({
    fetcher,
    name: 'webhook',
    url: buildUrl(input.baseUrl, '/webhook'),
    expectedStatus: 200,
    init: {
      method: 'POST',
      headers: webhookHeaders(input),
      body: JSON.stringify(smokeUpdate()),
    },
  });
}

interface CheckRequest {
  fetcher: HttpFetcher;
  name: string;
  url: string;
  expectedStatus: number;
  init: RequestInit;
}

async function executeCheck(input: CheckRequest): Promise<SmokeCheck> {
  const response = await input.fetcher(input.url, input.init);
  const body = await response.text();
  return {
    name: input.name,
    url: input.url,
    expectedStatus: input.expectedStatus,
    actualStatus: response.status,
    passed: response.status === input.expectedStatus,
    body,
  };
}

function readinessHeaders(input: StagingWebhookSmokeInput): Record<string, string> {
  return { [READINESS_TOKEN_HEADER]: input.readinessToken };
}

function webhookHeaders(input: StagingWebhookSmokeInput): Record<string, string> {
  return {
    'content-type': 'application/json',
    [TELEGRAM_SECRET_HEADER]: input.webhookSecret,
    [SMOKE_CLIENT_IP_HEADER]: SMOKE_CLIENT_IP,
  };
}

function smokeUpdate(): Record<string, unknown> {
  const user = { id: 987654321, is_bot: false, first_name: 'Tempot Smoke' };
  return {
    update_id: Date.now(),
    my_chat_member: {
      chat: { id: 987654321, type: 'private', first_name: 'Tempot Smoke' },
      from: user,
      date: Math.floor(Date.now() / 1_000),
      old_chat_member: { user, status: 'kicked' },
      new_chat_member: { user, status: 'member' },
    },
  };
}

function writeEvidence(evidencePath: string, result: StagingWebhookSmokeResult): void {
  mkdirSync(path.dirname(evidencePath), { recursive: true });
  writeFileSync(evidencePath, renderEvidence(result));
}

function renderEvidence(result: StagingWebhookSmokeResult): string {
  const lines = [
    '# Staging Webhook Smoke Evidence',
    '',
    `- Generated at: ${result.generatedAt}`,
    `- Result: ${result.passed ? 'PASS' : 'FAIL'}`,
    '',
    '| Check | Expected | Actual | Result |',
    '|---|---:|---:|---|',
    ...result.checks.map(
      (check) =>
        `| ${check.name} | ${check.expectedStatus} | ${check.actualStatus} | ${
          check.passed ? 'PASS' : 'FAIL'
        } |`,
    ),
    '',
  ];
  return lines.join('\n');
}

function buildUrl(baseUrl: string, route: string): string {
  return new URL(route, normalizedBaseUrl(baseUrl)).toString();
}

function normalizedBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
}

function fromEnvironment(): StagingWebhookSmokeInput {
  const baseUrl = requiredEnv('TEMPOT_STAGING_BASE_URL');
  const webhookSecret = requiredEnv('WEBHOOK_SECRET_TOKEN');
  const readinessToken = requiredEnv('TEMPOT_READINESS_TOKEN');
  return {
    baseUrl,
    webhookSecret,
    readinessToken,
    evidencePath: process.env['TEMPOT_EVIDENCE_OUTPUT'],
  };
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

async function main(): Promise<void> {
  const result = await runStagingWebhookSmoke(fromEnvironment());
  process.stdout.write(renderEvidence(result));
  process.exitCode = result.passed ? 0 : 1;
}

const entryPoint = process.argv[1];
if (entryPoint && import.meta.url === pathToFileURL(entryPoint).href) {
  await main();
}
