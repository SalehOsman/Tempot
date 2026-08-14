import type {
  ModuleBlueprint,
  ModuleNameValidation,
  ModuleOptionsValidation,
  ModuleType,
} from './module-generator.types.js';

const MODULE_NAME_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const MODULE_NAME_ERROR = 'Module name must be kebab-case, for example person-registration.';
const SUPPORTED_MODULE_TYPES: readonly ModuleType[] = [
  'core-platform',
  'operational',
  'product',
  'integration',
  'example',
];
const SUPPORTED_BLUEPRINTS: readonly ModuleBlueprint[] = ['basic'];

export function validateModuleName(moduleName: string): ModuleNameValidation {
  if (!MODULE_NAME_PATTERN.test(moduleName)) {
    return { ok: false, error: MODULE_NAME_ERROR };
  }

  return { ok: true, moduleName };
}

export function validateModuleOptions(
  moduleType = 'product',
  blueprint = 'basic',
): ModuleOptionsValidation {
  if (!isSupportedModuleType(moduleType)) {
    return {
      ok: false,
      error: `Unsupported module type: ${moduleType}. Supported values: ${SUPPORTED_MODULE_TYPES.join(', ')}.`,
    };
  }

  if (!isSupportedBlueprint(blueprint)) {
    return {
      ok: false,
      error: `Unsupported module blueprint: ${blueprint}. Supported values: ${SUPPORTED_BLUEPRINTS.join(', ')}.`,
    };
  }

  return { ok: true, moduleType, blueprint };
}

function isSupportedModuleType(value: string): value is ModuleType {
  return SUPPORTED_MODULE_TYPES.includes(value as ModuleType);
}

function isSupportedBlueprint(value: string): value is ModuleBlueprint {
  return SUPPORTED_BLUEPRINTS.includes(value as ModuleBlueprint);
}
