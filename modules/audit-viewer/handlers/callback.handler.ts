import type { Context, NextFunction } from 'grammy';
import { getDeps } from '../deps.context.js';
import { createStatsMenu } from '../menus/stats-menu.factory.js';
import { InteractionAuditRepository } from '../repositories/interaction-audit.repository.js';
import { InteractionProblemService } from '../services/interaction-problem.service.js';

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

  await ctx.answerCallbackQuery();
  const action = data.split(':')[1] ?? 'view';
  await showStatsPage(ctx, action);
}

async function showStatsPage(ctx: Context, action: string): Promise<void> {
  const { i18n } = getDeps();
  await ctx.editMessageText(await resolveStatsText(action), {
    parse_mode: 'HTML',
    reply_markup: createStatsMenu(i18n.t),
  });
}

async function resolveStatsText(action: string): Promise<string> {
  const deps = getDeps();
  if (action === 'problems') {
    const repository = new InteractionAuditRepository({ auditLog: deps.auditLog });
    return new InteractionProblemService(repository).renderRecentProblems(deps.i18n.t);
  }
  const key = action === 'view' ? 'audit-viewer.view.title' : `audit-viewer.view.${action}`;
  return deps.i18n.t(key);
}
