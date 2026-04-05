import { Result, ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { BotServerConfig, BotMode } from '../bot-server.types.js';
import { BOT_SERVER_ERRORS } from '../bot-server.errors.js';

const VALID_BOT_MODES: ReadonlySet<string> = new Set(['polling', 'webhook']);
const DEFAULT_PORT = 3000;

function parseSuperAdminIds(raw: string | undefined): Result<number[], AppError> {
  if (!raw || raw.trim() === '') {
    return ok([]);
  }

  const parts = raw.split(',');
  const ids: number[] = [];

  for (const part of parts) {
    const trimmed = part.trim();
    const num = Number(trimmed);
    if (!Number.isInteger(num) || trimmed === '') {
      return err(
        new AppError(BOT_SERVER_ERRORS.INVALID_SUPER_ADMIN_IDS, {
          value: raw,
        }),
      );
    }
    ids.push(num);
  }

  return ok(ids);
}

function validateWebhookFields(
  env: NodeJS.ProcessEnv,
): Result<{ webhookUrl: string; webhookSecret: string }, AppError> {
  const webhookUrl = env['WEBHOOK_URL'];
  if (!webhookUrl) {
    return err(new AppError(BOT_SERVER_ERRORS.MISSING_WEBHOOK_URL));
  }

  const webhookSecret = env['WEBHOOK_SECRET'];
  if (!webhookSecret) {
    return err(new AppError(BOT_SERVER_ERRORS.MISSING_WEBHOOK_SECRET));
  }

  return ok({ webhookUrl, webhookSecret });
}

export function loadConfig(): Result<BotServerConfig, AppError> {
  const botToken = process.env['BOT_TOKEN'];
  if (!botToken) {
    return err(new AppError(BOT_SERVER_ERRORS.MISSING_BOT_TOKEN));
  }

  const rawMode = process.env['BOT_MODE'];
  if (!rawMode || !VALID_BOT_MODES.has(rawMode)) {
    return err(new AppError(BOT_SERVER_ERRORS.INVALID_BOT_MODE, { value: rawMode }));
  }
  const botMode = rawMode as BotMode;

  const port = process.env['PORT'] ? Number(process.env['PORT']) : DEFAULT_PORT;
  if (!Number.isFinite(port) || port < 1 || port > 65535) {
    return err(new AppError(BOT_SERVER_ERRORS.INVALID_PORT, { value: process.env['PORT'] }));
  }

  const adminResult = parseSuperAdminIds(process.env['SUPER_ADMIN_IDS']);
  if (adminResult.isErr()) {
    return err(adminResult.error);
  }

  const config: BotServerConfig = {
    botToken,
    botMode,
    port,
    superAdminIds: adminResult.value,
  };

  if (botMode === 'webhook') {
    const webhookResult = validateWebhookFields(process.env);
    if (webhookResult.isErr()) {
      return err(webhookResult.error);
    }
    config.webhookUrl = webhookResult.value.webhookUrl;
    config.webhookSecret = webhookResult.value.webhookSecret;
  }

  return ok(config);
}
