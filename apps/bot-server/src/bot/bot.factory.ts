import { Bot, type Context } from 'grammy';
import { createSanitizerMiddleware } from './middleware/sanitizer.middleware.js';
import { createRateLimiterMiddleware } from './middleware/rate-limiter.middleware.js';
import {
  createMaintenanceMiddleware,
  type MaintenanceDeps,
} from './middleware/maintenance.middleware.js';
import { createAuthMiddleware, type AuthDeps } from './middleware/auth.middleware.js';
import {
  createScopedUsersMiddleware,
  type ScopedUsersDeps,
} from './middleware/scoped-users.middleware.js';
import { createValidationMiddleware } from './middleware/validation.middleware.js';
import { createAuditMiddleware, type AuditDeps } from './middleware/audit.middleware.js';
import { createErrorBoundary, type ErrorBoundaryDeps } from './error-boundary.js';

export interface BotFactoryDeps
  extends MaintenanceDeps, AuthDeps, ScopedUsersDeps, AuditDeps, ErrorBoundaryDeps {
  t: (key: string, options?: Record<string, unknown>) => string;
}

/**
 * Creates and configures a grammY Bot with the full middleware
 * chain in the fixed, non-negotiable order:
 * 1. sanitizer  2. rate limiter  3. maintenance  4. auth
 * 5. scoped users  6. validation  7. (handlers)  8. audit
 *
 * Error boundary is registered via bot.catch().
 */
export function createBot(token: string, deps: BotFactoryDeps): Bot<Context> {
  const bot = new Bot<Context>(token);

  bot.use(createSanitizerMiddleware());
  bot.use(createRateLimiterMiddleware({ t: deps.t }));
  bot.use(createMaintenanceMiddleware(deps));
  bot.use(createAuthMiddleware(deps));
  bot.use(createScopedUsersMiddleware(deps));
  bot.use(createValidationMiddleware());
  // Handlers are registered by modules, not here
  bot.use(createAuditMiddleware(deps));

  bot.catch(createErrorBoundary(deps));

  return bot;
}
