import { err, ok } from 'neverthrow';
import type { Result } from 'neverthrow';
import { AppError } from '@tempot/shared';
import { BOT_SERVER_ERRORS } from '../src/bot-server.errors.js';

const VALID_ACTIONS = new Set(['set', 'delete', 'info']);

export type WebhookManagerAction = 'set' | 'delete' | 'info';

export interface ResolveWebhookManagerConfigInput {
  action: string | undefined;
  env: Record<string, string | undefined>;
}

export interface WebhookManagerConfig {
  action: WebhookManagerAction;
  botToken: string;
  webhookUrl?: string;
  webhookSecret?: string;
}

export function resolveWebhookManagerConfig(
  input: ResolveWebhookManagerConfigInput,
): Result<WebhookManagerConfig, AppError> {
  if (!input.action || !VALID_ACTIONS.has(input.action)) {
    return err(new AppError(BOT_SERVER_ERRORS.WEBHOOK_MANAGER_INVALID_ACTION));
  }

  const botToken = input.env['BOT_TOKEN'];
  if (!botToken) return err(new AppError(BOT_SERVER_ERRORS.MISSING_BOT_TOKEN));

  const action = input.action as WebhookManagerAction;
  if (action !== 'set') return ok({ action, botToken });

  return resolveSetWebhookConfig(input.env, botToken);
}

function resolveSetWebhookConfig(
  env: Record<string, string | undefined>,
  botToken: string,
): Result<WebhookManagerConfig, AppError> {
  if (env['BOT_MODE'] !== 'webhook') {
    return err(new AppError(BOT_SERVER_ERRORS.INVALID_BOT_MODE, { value: env['BOT_MODE'] }));
  }

  const webhookUrl = env['WEBHOOK_URL'];
  if (!webhookUrl) return err(new AppError(BOT_SERVER_ERRORS.MISSING_WEBHOOK_URL));

  const webhookSecret = env['WEBHOOK_SECRET_TOKEN'];
  if (!webhookSecret) return err(new AppError(BOT_SERVER_ERRORS.MISSING_WEBHOOK_SECRET));

  return ok({ action: 'set', botToken, webhookUrl, webhookSecret });
}
