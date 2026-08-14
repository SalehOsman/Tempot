import type { Context, NextFunction } from 'grammy';

export interface MaintenanceStatus {
  enabled: boolean;
  isSuperAdmin: (userId: number) => boolean;
}

export interface MaintenanceDeps {
  getMaintenanceStatus: () => Promise<MaintenanceStatus>;
  t: (key: string) => string;
}

/**
 * Creates maintenance mode middleware.
 * Blocks all non-super-admin users when maintenance is enabled.
 */
export function createMaintenanceMiddleware(
  deps: MaintenanceDeps,
): (ctx: Context, next: NextFunction) => Promise<void> {
  return async (ctx: Context, next: NextFunction): Promise<void> => {
    const status = await deps.getMaintenanceStatus();

    if (status.enabled) {
      const userId = ctx.from?.id;
      if (userId && status.isSuperAdmin(userId)) {
        await next();
        return;
      }
      await ctx.reply(deps.t('bot-server.maintenance_mode'));
      return;
    }

    await next();
  };
}
