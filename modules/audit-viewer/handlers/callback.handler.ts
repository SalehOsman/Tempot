import type { Context, NextFunction } from 'grammy';
import { editOrSend } from '@tempot/ux-helpers';
import { getDeps } from '../deps.context.js';
import { createStatsMenu } from '../menus/stats-menu.factory.js';
import { InteractionAuditRepository } from '../repositories/interaction-audit.repository.js';
import { InteractionEventRepository } from '../repositories/interaction-event.repository.js';
import { InteractionProblemService } from '../services/interaction-problem.service.js';
import { InteractionTimelineService } from '../services/interaction-timeline.service.js';
import { ModuleStatsService } from '../services/module-stats.service.js';
import { RuntimeStatsService } from '../services/runtime-stats.service.js';

const noopNext: NextFunction = () => Promise.resolve();

export async function handleCallbackQuery(
  ctx: Context,
  next: NextFunction = noopNext,
): Promise<void> {
  const data = ctx.callbackQuery?.data;
  if (!data?.startsWith('stats:')) {
    await next();
    return;
  }

  const action = data.split(':')[1] ?? 'view';
  await showStatsPage(ctx, action);
}

async function showStatsPage(ctx: Context, action: string): Promise<void> {
  const { i18n } = getDeps();
  const result = await editOrSend(ctx as unknown as Parameters<typeof editOrSend>[0], {
    text: await resolveStatsText(action),
    parseMode: 'HTML',
    replyMarkup: createStatsMenu(i18n.t, action === 'view' ? 'main' : 'leaf'),
    unchangedCallbackText: i18n.t('bot-server.callback_unchanged'),
  });
  if (result.isErr()) throw result.error;
}

async function resolveStatsText(action: string): Promise<string> {
  const deps = getDeps();
  if (action === 'problems') {
    const repository = new InteractionAuditRepository({ auditLog: deps.auditLog });
    const fallbackRepository = new InteractionEventRepository({
      interactionEvents: deps.interactionEvents,
    });
    return new InteractionProblemService(repository, fallbackRepository).renderRecentProblems(
      deps.i18n.t,
    );
  }
  if (action === 'timeline') {
    const repository = new InteractionEventRepository({
      interactionEvents: deps.interactionEvents,
    });
    return new InteractionTimelineService(repository).renderRecentTimeline(deps.i18n.t);
  }
  if (action === 'modules') {
    return new ModuleStatsService(deps.config).render(deps.i18n.t);
  }
  if (action === 'runtime') {
    return new RuntimeStatsService().render(deps.i18n.t);
  }
  const key = action === 'view' ? 'audit-viewer.view.title' : `audit-viewer.view.${action}`;
  return deps.i18n.t(key);
}
