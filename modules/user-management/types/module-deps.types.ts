/**
 * ModuleDeps — واجهة الـ dependencies الممرّرة من bot-server
 *
 * تُطابق ModuleDependencyContainer من @tempot/bot-server-types لكنها
 * مُعرَّفة هنا لتجنب circular dependency.
 */
import type { ModuleConfig } from '@tempot/module-registry';

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

export interface ModuleDeps {
  logger: ModuleLogger;
  eventBus: ModuleEventBus;
  sessionProvider: ModuleSessionProvider;
  i18n: ModuleI18n;
  settings: ModuleSettings;
  config: ModuleConfig;
}
