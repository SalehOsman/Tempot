/**
 * Module-local dependency contract matching the bot-server module container.
 * It stays local to avoid coupling this module back to the app layer.
 */
import type { Context, MiddlewareFn } from 'grammy';
import type { ModuleConfig, ModuleNavigationItem, UserRole } from '@tempot/module-registry';
import type { ProtectedDataService } from '@tempot/database';

export interface ModuleLogger {
  info: (data: Record<string, unknown>) => void;
  warn: (data: Record<string, unknown>) => void;
  error: (data: Record<string, unknown>) => void;
  debug: (data: Record<string, unknown>) => void;
  child: (bindings: Record<string, unknown>) => ModuleLogger;
}

export interface ModuleEventBus {
  publish: (event: string, payload: Record<string, unknown>) => Promise<{ isOk: () => boolean }>;
}

export interface ModuleSessionProvider {
  getSession: (userId: string, chatId: string) => Promise<unknown>;
}

export interface ModuleI18n {
  t: (key: string, options?: Record<string, unknown>) => string;
}

export interface ModuleSettings {
  get: (key: string) => Promise<unknown>;
}

export interface ModuleNavigationProvider {
  getMainMenuItems: (role: UserRole) => readonly ModuleNavigationItem[];
}

export interface ModuleAuthorizationPolicy {
  module: string;
  classification: 'public' | 'bootstrap' | 'protected';
  action: string;
  subject: string;
}

export interface ModuleAuthorizationProvider {
  guard: (policy: ModuleAuthorizationPolicy) => MiddlewareFn<Context>;
  enforce: (ctx: Context, policy: ModuleAuthorizationPolicy) => Promise<boolean>;
}

export interface ModuleDeps {
  logger: ModuleLogger;
  eventBus: ModuleEventBus;
  sessionProvider: ModuleSessionProvider;
  i18n: ModuleI18n;
  settings: ModuleSettings;
  protectedData?: ProtectedDataService;
  navigation?: ModuleNavigationProvider;
  authorization: ModuleAuthorizationProvider;
  config: ModuleConfig;
}
