import type { Context, NextFunction } from 'grammy';
import { editOrSend } from '@tempot/ux-helpers';
import { getDeps } from '../deps.context.js';
import type { NotificationAuditRecord, NotificationInteractionRecord } from '../index.js';
import {
  formatAuditActivity,
  formatInteractionActivity,
  summarizeInteractionActivity,
} from './activity.formatter.js';
import {
  createNotificationMenu,
  type NotificationMenuSurface,
} from '../menus/notification-menu.factory.js';
import { resolveCallbackAuthorizationPolicy } from './callback-authorization.policy.js';

const noopNext: NextFunction = () => Promise.resolve();

interface TestNotificationResult {
  readonly chatId: string;
  readonly reference: string;
  readonly requestedAt: string;
  readonly telegramId: string;
}

interface PreferenceSnapshot {
  readonly enabled?: boolean;
  readonly text: string;
}

interface NotificationPageOptions {
  readonly action: string;
  readonly preferenceOverride?: boolean;
  readonly testBlocked?: boolean;
  readonly testResult?: TestNotificationResult;
}

export async function handleCallbackQuery(
  ctx: Context,
  next: NextFunction = noopNext,
): Promise<void> {
  const data = ctx.callbackQuery?.data;
  if (!data?.startsWith('notifications:')) {
    await next();
    return;
  }

  const action = data.split(':')[1] ?? 'view';
  const policy = resolveCallbackAuthorizationPolicy(action);
  if (!(await getDeps().authorization.enforce(ctx, policy))) return;

  if (action === 'toggle') {
    await toggleNotificationPreference(ctx);
    return;
  }
  if (action === 'test') {
    if (await isNotificationDeliveryDisabled()) {
      await showNotificationPage(ctx, { action: 'test', testBlocked: true });
      return;
    }
    const testResult = await publishTestRequest(ctx);
    await sendTestDelivery(ctx, testResult);
    await showNotificationPage(ctx, { action, testResult });
    return;
  }
  await showNotificationPage(ctx, { action });
}

async function publishTestRequest(ctx: Context): Promise<TestNotificationResult> {
  const requestedAt = new Date().toISOString();
  const reference = createTestReference(new Date(requestedAt));
  const telegramId = ctx.from?.id.toString() ?? '';
  const chatId = ctx.chat?.id.toString() ?? '';
  await getDeps().eventBus.publish('notification-center.notification.test_requested', {
    chatId,
    reference,
    requestedAt,
    telegramId,
  });
  return { chatId, reference, requestedAt, telegramId };
}

async function sendTestDelivery(ctx: Context, result: TestNotificationResult): Promise<void> {
  const { i18n } = getDeps();
  await ctx.reply(
    i18n.t('notification-center.test.delivery_message', { reference: result.reference }),
    { parse_mode: 'HTML' },
  );
}

async function isNotificationDeliveryDisabled(): Promise<boolean> {
  const { settings } = getDeps();
  return (await settings.get('notifications_enabled')) === false;
}

async function showNotificationPage(ctx: Context, opts: NotificationPageOptions): Promise<void> {
  const { i18n } = getDeps();
  const key = resolveViewKey(opts.action);
  const snapshot = await createViewSnapshot(key, opts);

  const result = await editOrSend(ctx as unknown as Parameters<typeof editOrSend>[0], {
    text: snapshot.text,
    parseMode: 'HTML',
    replyMarkup: createNotificationMenu(i18n.t, resolveMenuSurface(opts.action), {
      notificationsEnabled: snapshot.enabled,
    }),
    unchangedCallbackText: i18n.t('bot-server.callback_unchanged'),
  });
  if (result.isErr()) throw result.error;
}

function resolveViewKey(action: string): string {
  if (action === 'view') return 'notification-center.view.title';
  if (action === 'test') return 'notification-center.view.test_result';
  if (action === 'activity') return 'notification-center.view.activity';
  return 'notification-center.view.preferences';
}

function resolveMenuSurface(action: string): NotificationMenuSurface {
  if (action === 'test') return 'test-result';
  if (action === 'activity') return 'activity';
  if (action === 'preferences') return 'preferences';
  return 'main';
}

async function toggleNotificationPreference(ctx: Context): Promise<void> {
  const { settings } = getDeps();
  const current = await settings.get('notifications_enabled');
  const next = current === false;
  const updatedBy = ctx.from?.id.toString() ?? null;
  await settings.set('notifications_enabled', next, updatedBy);
  await showNotificationPage(ctx, { action: 'preferences', preferenceOverride: next });
}

function createTestReference(requestedAt: Date): string {
  const timestamp = requestedAt.getTime().toString(36).toUpperCase();
  const suffix = crypto.randomUUID().slice(0, 8).toUpperCase();
  return `NTF-${timestamp}-${suffix}`;
}

async function createViewSnapshot(
  key: string,
  opts: NotificationPageOptions,
): Promise<PreferenceSnapshot> {
  const { i18n } = getDeps();
  if (opts.action === 'test' && opts.testBlocked) {
    return { text: i18n.t('notification-center.view.test_disabled') };
  }
  if (opts.action === 'test' && opts.testResult) {
    return {
      text: i18n.t(key, {
        reference: opts.testResult.reference,
        requestedAt: opts.testResult.requestedAt,
      }),
    };
  }
  if (opts.action === 'preferences') return createPreferenceSnapshot(opts.preferenceOverride);
  if (opts.action === 'activity') return { text: await createActivityText() };
  return { text: i18n.t(key) };
}

async function createPreferenceSnapshot(override?: boolean): Promise<PreferenceSnapshot> {
  const { i18n, settings } = getDeps();
  const enabled = override ?? (await settings.get('notifications_enabled'));
  if (enabled === true) {
    return { enabled: true, text: i18n.t('notification-center.view.preferences_enabled') };
  }
  if (enabled === false) {
    return { enabled: false, text: i18n.t('notification-center.view.preferences_disabled') };
  }
  return { text: i18n.t('notification-center.view.preferences_unavailable') };
}

async function createActivityText(): Promise<string> {
  const { i18n } = getDeps();
  const interactions = await findInteractionActivity();
  const visibleInteractions = summarizeInteractionActivity(interactions);
  if (visibleInteractions.length > 0) {
    return i18n.t('notification-center.view.activity_items', {
      items: visibleInteractions
        .map((record) => formatInteractionActivity(record, i18n.t))
        .join('\n'),
    });
  }
  const auditRecords = await findAuditActivity();
  if (auditRecords.length === 0) return i18n.t('notification-center.view.activity_empty');
  return i18n.t('notification-center.view.activity_items', {
    items: auditRecords.map((record) => formatAuditActivity(record, i18n.t)).join('\n'),
  });
}

async function findInteractionActivity(): Promise<NotificationInteractionRecord[]> {
  const { interactionEvents } = getDeps();
  return interactionEvents.findMany({
    orderBy: { occurredAt: 'desc' },
    take: 40,
    where: { callbackNamespace: 'notifications' },
  });
}

async function findAuditActivity(): Promise<NotificationAuditRecord[]> {
  const { auditLog } = getDeps();
  return auditLog.findMany({
    orderBy: { timestamp: 'desc' },
    take: 5,
    where: { module: 'notification-center' },
  });
}
