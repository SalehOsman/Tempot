import { DomainError } from '@tembot/shared-types';

export type SurfaceType = 'bot' | 'tma' | 'dashboard';

export class SettingsError extends DomainError {
  public readonly code: string;
  public readonly httpStatus: number;

  constructor(code: string, message: string, httpStatus = 500, details?: unknown) {
    super(message, details);
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

export interface BotSurfaceSettings {
  readonly botName: string;
  readonly welcomeMessage: string;
  readonly helpMessage: string;
  readonly isMaintenance: boolean;
  readonly locale: 'ar' | 'en';
}

export interface TmaSurfaceSettings {
  readonly title: string;
  readonly primaryColor: string;
  readonly isMaintenance: boolean;
  readonly locale: 'ar' | 'en';
}

export interface DashboardSurfaceSettings {
  readonly platformName: string;
  readonly logoUrl: string | null;
  readonly defaultLocale: 'ar' | 'en';
  readonly sessionTimeoutMinutes: number;
  readonly isGlobalMaintenance: boolean;
}

export interface UpdateSettingsInput {
  readonly platformName?: string;
  readonly defaultLocale?: 'ar' | 'en';
  readonly isGlobalMaintenance?: boolean;
  readonly globalMaintenanceMessage?: string;
  readonly botName?: string;
  readonly botWelcomeMessage?: string;
  readonly botHelpMessage?: string;
  readonly botMaintenanceMode?: boolean;
  readonly tmaTitle?: string;
  readonly tmaPrimaryColor?: string;
  readonly tmaMaintenanceMode?: boolean;
  readonly dashboardLogoUrl?: string;
  readonly sessionTimeoutMinutes?: number;
}
