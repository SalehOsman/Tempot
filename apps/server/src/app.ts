import {
  OperatorLoginSchema,
  TelegramInitDataAuthSchema,
  UpdateSystemSettingsSchema,
} from '@tembot/contracts';
import { createChildLogger } from '@tembot/logger';
import { type AccessService, validateTelegramInitData } from '@tembot/module-access-control';
import type { SettingsService } from '@tembot/module-system-settings';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

const serverLogger = createChildLogger({ module: 'app-server', slice: 'gateway' });

export interface AppServerDependencies {
  readonly accessService?: AccessService;
  readonly settingsService?: SettingsService;
  readonly botToken?: string;
  readonly defaultTenantId?: string;
}

/**
 * Creates and configures the Sovereign Hono HTTP & RPC Gateway.
 */
export function createApp(deps: AppServerDependencies = {}) {
  const app = new Hono();
  const defaultTenantId = deps.defaultTenantId ?? '00000000-0000-0000-0000-000000000000';
  const botToken = deps.botToken ?? process.env.TELEGRAM_BOT_TOKEN ?? 'TEST_BOT_TOKEN';

  // Cross-Origin Resource Sharing for Dashboard and TMA surfaces
  app.use(
    '*',
    cors({
      origin: '*',
      allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
    }),
  );

  // Health and Readiness Probe
  app.get('/health', (c) => {
    return c.json({
      status: 'ok',
      service: 'tembot-gateway',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // Telegram TMA Cryptographic Authentication Endpoint
  app.post('/api/v1/auth/telegram', async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const parsed = TelegramInitDataAuthSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, 400);
    }

    const validationRes = validateTelegramInitData(parsed.data.initData, botToken);
    if (validationRes.isErr()) {
      serverLogger.warn({ error: validationRes.error.code }, 'Telegram auth signature rejected');
      return c.json({ error: validationRes.error.code, message: validationRes.error.message }, 401);
    }

    const validated = validationRes.value;
    return c.json({
      status: 'authenticated',
      actor: {
        id: String(validated.user?.id ?? 'anonymous'),
        type: 'telegram_user',
        capabilities: ['bot:interact', 'tma:access', 'settings:read'],
      },
      user: validated.user,
      authDate: validated.authDate,
    });
  });

  // Operator Login Endpoint for Admin Dashboard
  app.post('/api/v1/auth/login', async (c) => {
    if (!deps.accessService) {
      return c.json({ error: 'SERVICE_UNAVAILABLE', message: 'Access service unconfigured' }, 503);
    }

    const body = await c.req.json().catch(() => ({}));
    const parsed = OperatorLoginSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, 400);
    }

    const tenantId = c.req.header('X-Tenant-ID') ?? defaultTenantId;
    const ipAddress = c.req.header('x-forwarded-for') ?? '127.0.0.1';
    const userAgent = c.req.header('user-agent');

    const loginRes = await deps.accessService.login({
      tenantId,
      email: parsed.data.email,
      password: parsed.data.password,
      ipAddress,
      userAgent,
    });

    if (loginRes.isErr()) {
      return c.json(
        { error: loginRes.error.code, message: loginRes.error.message },
        loginRes.error.statusCode as ContentfulStatusCode,
      );
    }

    return c.json({
      token: loginRes.value.sessionToken,
      actor: loginRes.value.actor,
      expiresAt: loginRes.value.expiresAt.toISOString(),
    });
  });

  // System Settings Retrieval Endpoint
  app.get('/api/v1/settings', async (c) => {
    if (!deps.settingsService) {
      return c.json(
        { error: 'SERVICE_UNAVAILABLE', message: 'Settings service unconfigured' },
        503,
      );
    }

    const tenantId = c.req.header('X-Tenant-ID') ?? defaultTenantId;
    const res = await deps.settingsService.getSettings(tenantId);

    if (res.isErr()) {
      return c.json(
        { error: res.error.code, message: res.error.message },
        res.error.httpStatus as ContentfulStatusCode,
      );
    }

    return c.json({
      settings: res.value,
    });
  });

  // System Settings Update Endpoint
  app.patch('/api/v1/settings', async (c) => {
    if (!deps.settingsService) {
      return c.json(
        { error: 'SERVICE_UNAVAILABLE', message: 'Settings service unconfigured' },
        503,
      );
    }

    const tenantId = c.req.header('X-Tenant-ID') ?? defaultTenantId;
    const body = await c.req.json().catch(() => ({}));
    const parsed = UpdateSystemSettingsSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, 400);
    }

    const updateRes = await deps.settingsService.updateSettings(
      tenantId,
      parsed.data,
      'dashboard:operator',
    );

    if (updateRes.isErr()) {
      return c.json(
        { error: updateRes.error.code, message: updateRes.error.message },
        updateRes.error.httpStatus as ContentfulStatusCode,
      );
    }

    return c.json({
      settings: updateRes.value,
    });
  });

  return app;
}
