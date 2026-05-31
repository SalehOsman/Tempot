import type { ModuleConfig } from '@tempot/module-registry';

type TranslationFn = (key: string, options?: Record<string, unknown>) => string;

const FEATURE_KEYS = [
  'hasDatabase',
  'hasNotifications',
  'hasAttachments',
  'hasExport',
  'hasAI',
  'hasInputEngine',
  'hasImport',
  'hasSearch',
  'hasDynamicCMS',
  'hasRegional',
] as const satisfies readonly (keyof ModuleConfig['features'])[];

export class ModuleStatsService {
  constructor(private readonly config: ModuleConfig) {}

  render(t: TranslationFn): string {
    const enabledFeatureCount = FEATURE_KEYS.filter((key) => this.config.features[key]).length;
    const status = this.config.isActive
      ? t('audit-viewer.status.active')
      : t('audit-viewer.status.inactive');

    return [
      t('audit-viewer.modules.title'),
      t('audit-viewer.modules.summary', {
        moduleName: escapeHtml(this.config.name),
        status: escapeHtml(status),
        role: escapeHtml(this.config.requiredRole),
        commandCount: this.config.commands.length,
        enabledFeatureCount,
        requiredPackageCount: this.config.requires.packages.length,
        optionalPackageCount: this.config.requires.optional.length,
      }),
    ].join('\n\n');
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
