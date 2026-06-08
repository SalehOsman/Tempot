import type { AnyAbility } from '@casl/ability';
import type { SessionUser } from '@tempot/auth-core';
import type { Bot, Context, MiddlewareFn } from 'grammy';
import type { ModuleConfig, ModuleNavigationItem, UserRole } from '@tempot/module-registry';
import type { ProtectedDataService } from '@tempot/database';

/** Operation mode for the bot */
export type BotMode = 'polling' | 'webhook';

/** Dependencies passed to each module's setup function (D26 in spec.md) */
export interface ModuleDependencyContainer {
  logger: ModuleLogger;
  eventBus: ModuleEventBus;
  sessionProvider: SessionProvider;
  i18n: I18nProvider;
  settings: SettingsProvider;
  protectedData?: ProtectedDataService;
  auditLog: AuditLogProvider;
  interactionEvents: InteractionEventProvider;
  navigation: ModuleNavigationProvider;
  authorization: ModuleAuthorizationProvider;
  config: ModuleConfig;
}

export type AuthorizationClassification = 'public' | 'bootstrap' | 'protected';

export interface AuthorizationPolicy {
  module: string;
  classification: AuthorizationClassification;
  action: string;
  subject: string;
}

export interface ModuleAuthorizationProvider {
  guard: (policy: AuthorizationPolicy) => MiddlewareFn<Context>;
  enforce: (ctx: Context, policy: AuthorizationPolicy) => Promise<boolean>;
  refreshAndEnforce: (ctx: Context, policy: AuthorizationPolicy) => Promise<boolean>;
}

export interface ResolvedAuthorizationContext {
  actor: SessionUser;
  ability: AnyAbility;
}

export type AuthorizationContextResolver = (
  ctx: Context,
) => Promise<ResolvedAuthorizationContext | null>;

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
export interface SessionProvider {
  getSession: (userId: string, chatId: string) => Promise<unknown>;
}

/** i18n provider interface for modules */
export interface I18nProvider {
  t: (key: string, options?: Record<string, unknown>) => string;
}

/** Settings provider interface for modules */
export interface SettingsProvider {
  get: (key: string) => Promise<unknown>;
  set: (key: string, value: unknown, updatedBy: string | null) => Promise<unknown>;
}

/** Audit log reader exposed to operational modules. */
export interface AuditLogProvider {
  findMany: (args: Record<string, unknown>) => Promise<AuditLogProviderRecord[]>;
}

export interface AuditLogProviderRecord {
  action: string;
  module: string;
  targetId?: string | null;
  status: string;
  timestamp: Date;
  after?: unknown;
}

/** Detailed interaction event reader exposed to operational modules. */
export interface InteractionEventProvider {
  findMany: (args: Record<string, unknown>) => Promise<InteractionEventProviderRecord[]>;
}

export interface InteractionEventProviderRecord {
  traceId: string;
  sequence: number;
  updateId?: number | null;
  updateType: string;
  command?: string | null;
  callbackData?: string | null;
  callbackNamespace?: string | null;
  module: string;
  userId?: string | null;
  chatId?: string | null;
  stage: string;
  status: string;
  action?: string | null;
  viewKey?: string | null;
  responseType?: string | null;
  reason?: string | null;
  errorCode?: string | null;
  referenceCode?: string | null;
  metadata?: unknown;
  occurredAt: Date;
  createdAt: Date;
}

/** Active module navigation available to interface modules */
export interface ModuleNavigationProvider {
  getMainMenuItems: (role: UserRole) => readonly ModuleNavigationItem[];
}

/** Probe function for a single health check subsystem */
export type SubsystemProbe = () => Promise<SubsystemCheck>;

/** Probe registry matching HealthCheckResponse.checks subsystems */
export interface HealthProbes {
  database: SubsystemProbe;
  redis: SubsystemProbe;
  ai_provider: SubsystemProbe;
  disk: SubsystemProbe;
  queue_manager: SubsystemProbe;
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
