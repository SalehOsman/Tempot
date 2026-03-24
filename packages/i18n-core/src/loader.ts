import { glob } from 'glob';
import fs from 'node:fs/promises';
import path from 'node:path';
import i18next from 'i18next';
import { Result, ok, err } from 'neverthrow';

export async function loadModuleLocales(): Promise<Result<void, Error>> {
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
        const content = JSON.parse(contentStr);

        i18next.addResourceBundle(lang, moduleName, content, true, true);
      }
    }

    return ok(undefined);
  } catch (error) {
    return err(error instanceof Error ? error : new Error('Failed to load locales'));
  }
}
