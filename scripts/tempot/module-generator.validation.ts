import type { ModuleNameValidation } from './module-generator.types.js';

const MODULE_NAME_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const MODULE_NAME_ERROR = 'Module name must be kebab-case, for example person-registration.';

export function validateModuleName(moduleName: string): ModuleNameValidation {
  if (!MODULE_NAME_PATTERN.test(moduleName)) {
    return { ok: false, error: MODULE_NAME_ERROR };
  }

  return { ok: true, moduleName };
}
