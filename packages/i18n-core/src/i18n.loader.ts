import { glob } from 'glob';
import fs from 'node:fs/promises';
import path from 'node:path';
import i18next from 'i18next';
import { Result, ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';

/**
 * Scans module locale files (pattern: modules/&lt;name&gt;/locales/&lt;lang&gt;.json)
 * and registers each file as an i18next resource bundle.
 *
 * File path convention: `modules/{moduleName}/locales/{lang}.json`
 * - `moduleName` becomes the i18next namespace
 * - `lang` (filename without `.json`) becomes the language code
 *
 * @returns `Result<void, AppError>` — `Ok` on success, `Err` with
 *   `i18n.locale_load_failed` if any file operation fails
 *
 * @example
 * ```typescript
 * const result = await loadModuleLocales();
 * if (result.isErr()) {
 *   logger.error(result.error);
 * }
 * ```
 */
export async function loadModuleLocales(): Promise<Result<void, AppError>> {
  try {
    const localeFiles = await glob('modules/*/locales/*.json');

    for (const file of localeFiles) {
      // Normalize path to handle Windows backslashes
      const normalizedPath = file.replace(/\\/g, '/');
      const parts = normalizedPath.split('/');

      // Expected: modules / {moduleName} / locales / {lang}.json
      if (parts.length >= 4) {
        const moduleName = parts[1];
        const langFile = parts[3];
        const lang = path.basename(langFile, '.json');

        const contentStr = await fs.readFile(file, 'utf-8');
        const content = JSON.parse(contentStr) as Record<string, unknown>;

        i18next.addResourceBundle(lang, moduleName, content, true, true);
      }
    }

    return ok(undefined);
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Unknown error';
    return err(new AppError('i18n.locale_load_failed', details));
  }
}
