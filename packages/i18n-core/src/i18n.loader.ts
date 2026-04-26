import { glob } from 'glob';
import fs from 'node:fs/promises';
import path from 'node:path';
import i18next from 'i18next';
import { Result, ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';

/**
 * Scans module locale files (pattern: modules/<name>/locales/<lang>.json)
 * and registers each file as an i18next resource bundle under the default
 * `translation` namespace so `t()` can resolve keys without explicit ns.
 *
 * i18n-core is core infrastructure exempt from Rule XVI (ADR-033).
 *
 * @returns `Result<void, AppError>` — `Ok` on success, `Err` with
 *   `i18n.locale_load_failed` if any file operation fails
 */
export async function loadModuleLocales(): Promise<Result<void, AppError>> {
  try {
    // Use process.cwd() to get the correct project root in Docker and development
    const projectRoot = process.cwd();
    const modulePattern = path
      .join(projectRoot, 'modules', '*', 'locales', '*.json')
      .replace(/\\/g, '/');
    const appPattern = path
      .join(projectRoot, 'apps', '*', 'locales', '*.json')
      .replace(/\\/g, '/');

    const moduleFiles = await glob(modulePattern);
    const appFiles = await glob(appPattern);
    const localeFiles = [...moduleFiles, ...appFiles];

    for (const file of localeFiles) {
      // Normalize path to handle Windows backslashes
      const normalizedPath = file.replace(/\\/g, '/');
      const parts = normalizedPath.split('/');

      // Find the 'modules' or 'apps' segment to extract name and lang
      const modulesIdx = parts.indexOf('modules');
      const appsIdx = parts.indexOf('apps');
      const segmentIdx = modulesIdx >= 0 ? modulesIdx : appsIdx >= 0 ? appsIdx : -1;

      if (segmentIdx >= 0 && parts.length > segmentIdx + 3) {
        const langFile = parts[segmentIdx + 3];
        const lang = path.basename(langFile, '.json');

        const contentStr = await fs.readFile(file, 'utf-8');
        const content = JSON.parse(contentStr) as Record<string, unknown>;

        // Use default 'translation' namespace so t() finds keys without explicit ns
        i18next.addResourceBundle(lang, 'translation', content, true, true);
      }
    }

    return ok(undefined);
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    return err(new AppError('i18n.locale_load_failed', details));
  }
}
