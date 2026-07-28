import type { Context, NextFunction } from 'grammy';
import { editOrSend } from '@tempot/ux-helpers';
import { getDeps } from '../deps.context.js';
import { createKnowledgeMenu, type KnowledgeMenuSurface } from '../menus/knowledge-menu.factory.js';
import { KnowledgeViewService } from '../services/knowledge-view.service.js';

const noopNext: NextFunction = () => Promise.resolve();

interface KnowledgeView {
  readonly text: string;
  readonly surface: KnowledgeMenuSurface;
  readonly token?: string;
}

export async function handleCallbackQuery(
  ctx: Context,
  next: NextFunction = noopNext,
): Promise<void> {
  const data = ctx.callbackQuery?.data;
  if (!data?.startsWith('knowledge:')) {
    await next();
    return;
  }
  if (!(await canManageKnowledge(ctx))) return;

  const { i18n } = getDeps();
  const view = await resolveView(ctx, data);
  const result = await editOrSend(ctx as unknown as Parameters<typeof editOrSend>[0], {
    text: view.text,
    parseMode: 'HTML',
    replyMarkup: createKnowledgeMenu(i18n.t, view.surface, view.token),
    unchangedCallbackText: i18n.t('bot-server.callback_unchanged'),
  });
  if (result.isErr()) throw result.error;
}

async function canManageKnowledge(ctx: Context): Promise<boolean> {
  return getDeps().authorization.enforce(ctx, {
    module: 'knowledge-management',
    classification: 'admin',
    action: 'manage',
    subject: 'knowledge',
  });
}

async function resolveView(ctx: Context, callbackData: string): Promise<KnowledgeView> {
  const { i18n, knowledge } = getDeps();
  const actorId = ctx.from?.id ? String(ctx.from.id) : 'unknown';
  const service = new KnowledgeViewService(knowledge);
  if (callbackData === 'knowledge:status') {
    return { text: await service.renderStatus(i18n.t, actorId), surface: 'leaf' };
  }
  if (callbackData === 'knowledge:sources') {
    return { text: await service.renderSources(i18n.t, actorId), surface: 'leaf' };
  }
  if (callbackData === 'knowledge:dry_run') {
    return { text: await service.renderDryRun(i18n.t, actorId), surface: 'leaf' };
  }
  if (callbackData === 'knowledge:history') {
    return { text: await service.renderHistory(i18n.t, actorId), surface: 'leaf' };
  }
  if (callbackData === 'knowledge:write') return writeConfirmationView(service, i18n.t, actorId);
  if (callbackData.startsWith('knowledge:confirm_write:')) {
    return confirmWriteView({ service, t: i18n.t, actorId, callbackData });
  }
  if (callbackData === 'knowledge:full_reindex') {
    return { text: i18n.t('knowledge-management.view.full_reindex_planned'), surface: 'leaf' };
  }
  if (callbackData === 'knowledge:test_query') {
    return { text: i18n.t('knowledge-management.view.test_query_hint'), surface: 'leaf' };
  }
  return { text: i18n.t('knowledge-management.view.title'), surface: 'main' };
}

async function writeConfirmationView(
  service: KnowledgeViewService,
  t: (key: string, options?: Record<string, unknown>) => string,
  actorId: string,
): Promise<KnowledgeView> {
  const view = await service.renderWriteRequest(t, actorId);
  return { text: view.text, token: view.token, surface: view.token ? 'confirm-write' : 'leaf' };
}

async function confirmWriteView(input: {
  readonly service: KnowledgeViewService;
  readonly t: (key: string, options?: Record<string, unknown>) => string;
  readonly actorId: string;
  readonly callbackData: string;
}): Promise<KnowledgeView> {
  const token = input.callbackData.replace('knowledge:confirm_write:', '');
  return {
    text: await input.service.renderConfirmWrite(input.t, input.actorId, token),
    surface: 'leaf',
  };
}
