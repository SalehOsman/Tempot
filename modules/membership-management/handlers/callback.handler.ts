import type { Context, NextFunction } from 'grammy';
import { getDeps } from '../deps.context.js';
import type { ModuleAuthorizationPolicy } from '../index.js';
import {
  MEMBERSHIP_REASON_SKIP_CALLBACK,
  skipMembershipRequestReason,
  startMembershipRequestFlow,
} from './membership-request-flow.handler.js';
import {
  createBackToListMenu,
  createPendingRequestsMenu,
  createReviewActionsMenu,
} from '../menus/admin-membership-menu.factory.js';

const noopNext: NextFunction = () => Promise.resolve();
const ADMIN_REJECTION_REASON = 'membership-management.rejection.admin_rejected';
const REQUEST_POLICY: ModuleAuthorizationPolicy = {
  module: 'membership-management',
  classification: 'bootstrap',
  action: 'create',
  subject: 'membership-request',
};
const ADMIN_POLICY: ModuleAuthorizationPolicy = {
  module: 'membership-management',
  classification: 'protected',
  action: 'manage',
  subject: 'membership-request',
};

interface MembershipContextState {
  sessionUser?: { id: string | number };
}

export async function handleCallbackQuery(
  ctx: Context,
  next: NextFunction = noopNext,
): Promise<void> {
  const data = ctx.callbackQuery?.data;
  if (!data?.startsWith('membership:')) {
    await next();
    return;
  }

  if (data === 'membership:request') {
    if (!(await getDeps().authorization.enforce(ctx, REQUEST_POLICY))) return;
    await startMembershipRequestFlow(ctx);
    return;
  }

  if (data === MEMBERSHIP_REASON_SKIP_CALLBACK) {
    if (!(await getDeps().authorization.enforce(ctx, REQUEST_POLICY))) return;
    await skipMembershipRequestReason(ctx);
    return;
  }

  if (!(await getDeps().authorization.enforce(ctx, ADMIN_POLICY))) return;
  const handled = await handleAdminMembershipCallback(ctx, data);
  if (handled) return;

  await next();
}

async function handleAdminMembershipCallback(ctx: Context, data: string): Promise<boolean> {
  if (data === 'membership:list') {
    await showPendingRequests(ctx);
    return true;
  }

  const [namespace, action, requestId] = data.split(':');
  if (namespace !== 'membership' || requestId === undefined) return false;
  if (action === 'detail') return showRequestDetail(ctx, requestId);
  if (action === 'approve') return approveRequest(ctx, requestId);
  if (action === 'reject') return rejectRequest(ctx, requestId);
  return false;
}

async function showPendingRequests(ctx: Context): Promise<void> {
  const { i18n, membershipRequests } = getDeps();
  const result = await membershipRequests.listPending({ limit: 10 });
  if (result.isErr()) {
    await ctx.reply(i18n.t('membership-management.admin.failed'));
    return;
  }

  await ctx.editMessageText(i18n.t('membership-management.admin.list.title'), {
    parse_mode: 'HTML',
    reply_markup: createPendingRequestsMenu(result.value, i18n.t),
  });
}

async function showRequestDetail(ctx: Context, requestId: string): Promise<boolean> {
  const { i18n, membershipRequests } = getDeps();
  const result = await membershipRequests.getById(requestId);
  if (result.isErr()) {
    await ctx.reply(i18n.t('membership-management.admin.failed'));
    return true;
  }
  const request = result.value;

  await ctx.editMessageText(
    i18n.t('membership-management.admin.detail.body', {
      telegramId: request.telegramId,
      fullName: request.fullName ?? '-',
      nickname: request.nickname ?? '-',
      mobileNumber: request.mobileNumber ?? '-',
      username: request.telegramUsername ?? '-',
      language: request.telegramLanguageCode ?? '-',
      requestMessage: request.requestMessage ?? '-',
      requestedAt: request.requestedAt.toISOString(),
    }),
    {
      parse_mode: 'HTML',
      reply_markup: createReviewActionsMenu(request.id, i18n.t),
    },
  );
  return true;
}

async function approveRequest(ctx: Context, requestId: string): Promise<boolean> {
  const reviewerUserId = resolveReviewerUserId(ctx);
  if (reviewerUserId === null) return replyIdentityMissing(ctx);
  const { i18n, membershipRequests } = getDeps();
  const result = await membershipRequests.approve({ requestId, reviewerUserId });
  if (result.isErr()) {
    await ctx.reply(i18n.t('membership-management.admin.failed'));
    return true;
  }

  await ctx.editMessageText(i18n.t('membership-management.admin.approved'), {
    parse_mode: 'HTML',
    reply_markup: createBackToListMenu(i18n.t),
  });
  return true;
}

async function rejectRequest(ctx: Context, requestId: string): Promise<boolean> {
  const reviewerUserId = resolveReviewerUserId(ctx);
  if (reviewerUserId === null) return replyIdentityMissing(ctx);
  const { i18n, membershipRequests } = getDeps();
  const result = await membershipRequests.reject({
    requestId,
    reviewerUserId,
    rejectionReason: ADMIN_REJECTION_REASON,
  });
  if (result.isErr()) {
    await ctx.reply(i18n.t('membership-management.admin.failed'));
    return true;
  }

  await ctx.editMessageText(i18n.t('membership-management.admin.rejected'), {
    parse_mode: 'HTML',
    reply_markup: createBackToListMenu(i18n.t),
  });
  return true;
}

function resolveReviewerUserId(ctx: Context): string | null {
  const sessionUser = (ctx as Context & MembershipContextState).sessionUser;
  if (sessionUser !== undefined) return String(sessionUser.id);
  return ctx.from?.id === undefined ? null : String(ctx.from.id);
}

async function replyIdentityMissing(ctx: Context): Promise<true> {
  await ctx.reply(getDeps().i18n.t('membership-management.request.identity_missing'));
  return true;
}
