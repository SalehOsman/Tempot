import type { Context, NextFunction } from 'grammy';

export interface ScopedUsersDeps {
  commandScopeMap: Map<string, { scopedUsers?: number[] }>;
  t: (key: string) => string;
}

/**
 * Creates scoped users middleware that restricts commands to
 * explicitly listed user IDs. Even SUPER_ADMIN is blocked if
 * not in the scoped list (D13 in spec.md).
 */
export function createScopedUsersMiddleware(
  deps: ScopedUsersDeps,
): (ctx: Context, next: NextFunction) => Promise<void> {
  return async (ctx: Context, next: NextFunction): Promise<void> => {
    const text = ctx.message?.text;

    if (!text?.startsWith('/')) {
      await next();
      return;
    }

    const command = text.split(' ')[0].substring(1).split('@')[0];
    const moduleInfo = deps.commandScopeMap.get(command);

    if (!moduleInfo?.scopedUsers?.length) {
      await next();
      return;
    }

    const userId = ctx.from?.id;

    if (userId && moduleInfo.scopedUsers.includes(userId)) {
      await next();
      return;
    }

    await ctx.reply(deps.t('bot-server.not_authorized'));
  };
}
