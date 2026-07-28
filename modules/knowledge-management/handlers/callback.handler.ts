import type { Context, NextFunction } from 'grammy';
import { editOrSend } from '@tempot/ux-helpers';
import { getDeps } from '../deps.context.js';
import { createKnowledgeMenu, type KnowledgeMenuSurface } from '../menus/knowledge-menu.factory.js';
import { KnowledgeViewService } from '../services/knowledge-view.service.js';
import type { KnowledgeSourceProfile } from '../contracts/knowledge-operations.types.js';

const noopNext: NextFunction = () => Promise.resolve();

interface KnowledgeView {
  readonly text: string;
  readonly surface: KnowledgeMenuSurface;
  readonly token?: string;
  readonly profileId?: string;
  readonly profiles?: readonly KnowledgeSourceProfile[];
}

interface ResolveContext {
  readonly t: (key: string, options?: Record<string, unknown>) => string;
  readonly actorId: string;
  readonly service: KnowledgeViewService;
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
  if (isLongOperation(data)) {
    await sendView(ctx, loadingView(i18n.t));
    void sendBackgroundView(ctx, data);
    return;
  }
  const view = await resolveView(ctx, data);
  await sendView(ctx, view);
}

async function sendView(ctx: Context, view: KnowledgeView): Promise<void> {
  const { i18n } = getDeps();
  const result = await editOrSend(ctx as unknown as Parameters<typeof editOrSend>[0], {
    text: view.text,
    parseMode: 'HTML',
    replyMarkup: createKnowledgeMenu(i18n.t, view.surface, menuState(view)),
    unchangedCallbackText: i18n.t('bot-server.callback_unchanged'),
  });
  if (result.isErr()) throw result.error;
}

async function sendBackgroundView(ctx: Context, callbackData: string): Promise<void> {
  const { logger } = getDeps();
  try {
    await sendReplyView(ctx, await resolveView(ctx, callbackData));
  } catch (error) {
    logger.warn({ msg: 'knowledge_background_operation_failed', error: safeError(error) });
    await sendReplyView(ctx, failureView());
  }
}

async function sendReplyView(ctx: Context, view: KnowledgeView): Promise<void> {
  const { i18n, logger } = getDeps();
  const replyMarkup = createKnowledgeMenu(i18n.t, view.surface, menuState(view));
  try {
    await ctx.reply(view.text, { parse_mode: 'HTML', reply_markup: replyMarkup });
  } catch (error) {
    logger.warn({ msg: 'knowledge_background_reply_failed', error: safeError(error) });
  }
}

function isLongOperation(callbackData: string): boolean {
  return (
    callbackData.startsWith('knowledge:dry_run:') ||
    callbackData.startsWith('knowledge:write:') ||
    callbackData.startsWith('knowledge:confirm_write:')
  );
}

function safeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function loadingView(t: (key: string, options?: Record<string, unknown>) => string): KnowledgeView {
  return {
    text: t('knowledge-management.view.write_waiting'),
    surface: 'leaf',
  };
}

function failureView(): KnowledgeView {
  const { i18n } = getDeps();
  return { text: i18n.t('knowledge-management.view.operation_failed'), surface: 'leaf' };
}

function menuState(view: KnowledgeView): Parameters<typeof createKnowledgeMenu>[2] {
  return {
    token: view.token,
    profileId: view.profileId,
    profiles: view.profiles,
  };
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
  const context = {
    t: i18n.t,
    actorId: ctx.from?.id ? String(ctx.from.id) : 'unknown',
    service: new KnowledgeViewService(knowledge),
  };
  if (callbackData === 'knowledge:status') {
    return {
      text: await context.service.renderStatus(context.t, context.actorId),
      surface: 'leaf',
    };
  }
  if (isSourceCallback(callbackData)) return resolveSourceView(context, callbackData);
  if (callbackData.startsWith('knowledge:dry_run:')) {
    const profileId = callbackData.replace('knowledge:dry_run:', '');
    return {
      text: await context.service.renderDryRun(context.t, context.actorId, profileId),
      surface: 'leaf',
    };
  }
  if (callbackData === 'knowledge:history') {
    return {
      text: await context.service.renderHistory(context.t, context.actorId),
      surface: 'leaf',
    };
  }
  if (callbackData === 'knowledge:write' || callbackData === 'knowledge:dry_run') {
    return resolveSourcesList(context);
  }
  if (callbackData.startsWith('knowledge:write:')) {
    return writeConfirmationView({
      service: context.service,
      t: context.t,
      actorId: context.actorId,
      profileId: callbackData.replace('knowledge:write:', ''),
    });
  }
  if (callbackData.startsWith('knowledge:confirm_write:')) {
    return confirmWriteView({
      service: context.service,
      t: context.t,
      actorId: context.actorId,
      callbackData,
    });
  }
  if (callbackData.startsWith('knowledge:full_reindex')) {
    return { text: i18n.t('knowledge-management.view.full_reindex_planned'), surface: 'leaf' };
  }
  if (callbackData === 'knowledge:custom') {
    return { text: i18n.t('knowledge-management.view.custom_hint'), surface: 'leaf' };
  }
  if (callbackData === 'knowledge:test_query') {
    return { text: i18n.t('knowledge-management.view.test_query_hint'), surface: 'leaf' };
  }
  return { text: i18n.t('knowledge-management.view.title'), surface: 'main' };
}

function isSourceCallback(callbackData: string): boolean {
  return callbackData === 'knowledge:sources' || callbackData.startsWith('knowledge:source:');
}

async function resolveSourceView(
  context: ResolveContext,
  callbackData: string,
): Promise<KnowledgeView> {
  if (callbackData === 'knowledge:sources') return resolveSourcesList(context);
  const profileId = callbackData.replace('knowledge:source:', '');
  return {
    text: await context.service.renderSourceDetail(context.t, context.actorId, profileId),
    surface: 'source-actions',
    profileId,
  };
}

async function resolveSourcesList(context: ResolveContext): Promise<KnowledgeView> {
  const view = await context.service.renderSourcesView(context.t, context.actorId);
  return { text: view.text, surface: 'sources', profiles: view.profiles };
}

async function writeConfirmationView(input: {
  readonly service: KnowledgeViewService;
  readonly t: (key: string, options?: Record<string, unknown>) => string;
  readonly actorId: string;
  readonly profileId: string;
}): Promise<KnowledgeView> {
  const view = await input.service.renderWriteRequest(input.t, input.actorId, input.profileId);
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
