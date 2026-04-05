import type { Bot, Context } from 'grammy';
import type { ModuleConfig } from '@tempot/module-registry';

/** Operation mode for the bot */
export type BotMode = 'polling' | 'webhook';

/** Dependencies passed to each module's setup function (D26 in spec.md) */
export interface ModuleDependencyContainer {
  logger: ModuleLogger;
  eventBus: ModuleEventBus;
  sessionProvider: SessionProviderInterface;
  i18n: I18nProvider;
  settings: SettingsProvider;
  config: ModuleConfig;
}

/** Module setup function signature — default export from each module's index.ts */
export type ModuleSetupFn = (bot: Bot<Context>, deps: ModuleDependencyContainer) => Promise<void>;

/** Health check subsystem result */
export interface SubsystemCheck {
  status: 'ok' | 'error' | 'degraded';
  latency_ms?: number;
  error?: string;
  [key: string]: unknown;
}

/** Health check response shape (Architecture Spec Section 26.2) */
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  checks: {
    database: SubsystemCheck;
    redis: SubsystemCheck;
    ai_provider: SubsystemCheck;
    disk: SubsystemCheck;
    queue_manager: SubsystemCheck;
  };
  version: string;
}

/** Static configuration loaded from environment */
export interface BotServerConfig {
  botToken: string;
  botMode: BotMode;
  port: number;
  webhookUrl?: string;
  webhookSecret?: string;
  superAdminIds: number[];
}

/** Minimal logger interface for startup components */
export interface ModuleLogger {
  info: (data: unknown) => void;
  warn: (data: unknown) => void;
  error: (data: unknown) => void;
  debug: (data: unknown) => void;
  child: (bindings: Record<string, unknown>) => ModuleLogger;
}

/** Minimal event bus interface for modules */
export interface ModuleEventBus {
  publish: (event: string, payload: Record<string, unknown>) => Promise<{ isOk: () => boolean }>;
}

/** Session provider interface for modules */
export interface SessionProviderInterface {
  getSession: (userId: string, chatId: string) => Promise<unknown>;
}

/** i18n provider interface for modules */
export interface I18nProvider {
  t: (key: string, options?: Record<string, unknown>) => string;
}

/** Settings provider interface for modules */
export interface SettingsProvider {
  get: (key: string) => Promise<unknown>;
}

/** A single step in the startup sequence — used for logging and error reporting */
export interface StartupStep {
  /** Step identifier (e.g., 'loadConfig') */
  name: string;
  /** Execution order (1-based, sequential) */
  order: number;
  /** Whether failure in this step halts the application */
  fatal: boolean;
  /** Milliseconds taken to complete — set after step finishes */
  duration?: number;
}

/** A single step in the graceful shutdown sequence with its timeout */
export interface ShutdownStep {
  /** Step identifier (e.g., 'stopHttpServer') */
  name: string;
  /** Execution order (1-based, per Architecture Spec Section 25.3) */
  order: number;
  /** Maximum milliseconds allowed for this step */
  timeout: number;
}
