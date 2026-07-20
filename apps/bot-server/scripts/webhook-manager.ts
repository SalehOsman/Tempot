import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Bot } from 'grammy';
import type { WebhookInfo } from 'grammy/types';
import { resolveWebhookManagerConfig } from './webhook-manager.config.js';
import type { WebhookManagerConfig } from './webhook-manager.config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WEBHOOK_PATH = '/bot';

function loadRootEnvFile(): void {
  const envPath = path.resolve(__dirname, '../../../.env');
  if (existsSync(envPath) && typeof process.loadEnvFile === 'function') {
    process.loadEnvFile(envPath);
  }
}

loadRootEnvFile();

function writeOutput(message: string): void {
  process.stdout.write(`${message}\n`);
}

function writeError(message: string): void {
  process.stderr.write(`${message}\n`);
}

function webhookEndpoint(webhookUrl: string): string {
  return `${webhookUrl.replace(/\/$/, '')}${WEBHOOK_PATH}`;
}

async function runWebhookAction(config: WebhookManagerConfig): Promise<void> {
  const bot = new Bot(config.botToken);
  if (config.action === 'set') {
    await setWebhook(bot, config);
    return;
  }
  if (config.action === 'delete') {
    await deleteWebhook(bot);
    return;
  }
  await printWebhookInfo(bot);
}

async function setWebhook(bot: Bot, config: WebhookManagerConfig): Promise<void> {
  if (!config.webhookUrl || !config.webhookSecret) {
    throw new Error('Webhook URL and secret are required for set action.');
  }
  const endpoint = webhookEndpoint(config.webhookUrl);
  writeOutput(`Setting webhook to ${endpoint}...`);
  await bot.api.setWebhook(endpoint, { secret_token: config.webhookSecret });
  writeOutput('Webhook set successfully.');
}

async function deleteWebhook(bot: Bot): Promise<void> {
  writeOutput('Deleting webhook...');
  await bot.api.deleteWebhook({ drop_pending_updates: false });
  writeOutput('Webhook deleted successfully.');
}

async function printWebhookInfo(bot: Bot): Promise<void> {
  writeOutput('Fetching webhook info...');
  renderWebhookInfo(await bot.api.getWebhookInfo());
}

function renderWebhookInfo(info: WebhookInfo): void {
  writeOutput('');
  writeOutput('--- Webhook Info ---');
  writeOutput(`URL: ${info.url || '(none)'}`);
  writeOutput(`Has Custom Certificate: ${String(info.has_custom_certificate)}`);
  writeOutput(`Pending Update Count: ${String(info.pending_update_count)}`);
  if (info.ip_address) writeOutput(`IP Address: ${info.ip_address}`);
  if (info.last_error_date) {
    writeOutput(`Last Error Date: ${new Date(info.last_error_date * 1000).toLocaleString()}`);
  }
  if (info.last_error_message) writeOutput(`Last Error Message: ${info.last_error_message}`);
  if (info.last_synchronization_error_date) {
    writeOutput(
      `Last Sync Error Date: ${new Date(info.last_synchronization_error_date * 1000).toLocaleString()}`,
    );
  }
  if (info.max_connections) writeOutput(`Max Connections: ${String(info.max_connections)}`);
  if (info.allowed_updates) writeOutput(`Allowed Updates: ${info.allowed_updates.join(', ')}`);
  writeOutput('--------------------');
  writeOutput('');
}

async function main(): Promise<void> {
  const configResult = resolveWebhookManagerConfig({
    action: process.argv[2],
    env: process.env,
  });
  if (configResult.isErr()) {
    writeError(`Error: ${configResult.error.code}`);
    process.exitCode = 1;
    return;
  }

  try {
    await runWebhookAction(configResult.value);
  } catch (error) {
    writeError(`Error executing webhook manager: ${String(error)}`);
    process.exitCode = 1;
  }
}

main();
