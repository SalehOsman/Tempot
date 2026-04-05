import { MODULE_REGISTRY_ERRORS } from './module-registry.errors.js';
import {
  FEATURE_PACKAGE_MAP,
  type DiscoveredModule,
  type RegistryLogger,
  type ValidationError,
} from './module-registry.types.js';

/** Mandatory files/dirs every module must have */
const MANDATORY_PATHS = [
  'module.config.ts',
  'abilities.ts',
  'locales/ar.json',
  'locales/en.json',
  'index.ts',
  'features',
  'shared',
];

type PathExistsFn = (path: string) => Promise<boolean>;

/** Check mandatory files exist in a module directory */
export async function checkStructure(
  module: DiscoveredModule,
  pathExists: PathExistsFn,
  logger: RegistryLogger,
): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];

  for (const requiredPath of MANDATORY_PATHS) {
    const fullPath = `${module.path}/${requiredPath}`;
    if (!(await pathExists(fullPath))) {
      errors.push({
        module: module.name,
        code: MODULE_REGISTRY_ERRORS.STRUCTURE_INVALID,
        message: `Missing required path: ${requiredPath}`,
      });
    }
  }

  if (module.config.features.hasDatabase) {
    const dbErrors = await checkDatabaseStructure(module, pathExists);
    errors.push(...dbErrors);
  }

  const testsPath = `${module.path}/tests`;
  if (!(await pathExists(testsPath))) {
    logger.warn({ msg: 'Module missing tests/ directory', module: module.name });
  }

  return errors;
}

async function checkDatabaseStructure(
  module: DiscoveredModule,
  pathExists: PathExistsFn,
): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];
  const schemaPath = `${module.path}/database/schema.prisma`;
  const migrationsPath = `${module.path}/database/migrations`;

  if (!(await pathExists(schemaPath))) {
    errors.push({
      module: module.name,
      code: MODULE_REGISTRY_ERRORS.STRUCTURE_INVALID,
      message: 'Missing required path: database/schema.prisma',
    });
  }

  if (!(await pathExists(migrationsPath))) {
    errors.push({
      module: module.name,
      code: MODULE_REGISTRY_ERRORS.STRUCTURE_INVALID,
      message: 'Missing required path: database/migrations',
    });
  }

  return errors;
}

/** Spec gate context */
interface SpecGateContext {
  specDirs: string[];
  specsDir: string;
  pathExists: PathExistsFn;
}

/** Check spec gate: matching spec directory with spec.md */
export async function checkSpecGate(
  module: DiscoveredModule,
  ctx: SpecGateContext,
): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];

  const matchingDir = ctx.specDirs.find((dir) => {
    const stripped = dir.replace(/^\d+-/, '');
    return stripped === module.name || stripped === `${module.name}-package`;
  });

  if (!matchingDir) {
    errors.push({
      module: module.name,
      code: MODULE_REGISTRY_ERRORS.SPEC_GATE_FAILED,
      message: `No spec directory found for module: ${module.name}`,
    });
    return errors;
  }

  const specMdPath = `${ctx.specsDir}/${matchingDir}/spec.md`;
  if (!(await ctx.pathExists(specMdPath))) {
    errors.push({
      module: module.name,
      code: MODULE_REGISTRY_ERRORS.SPEC_GATE_FAILED,
      message: `Spec directory found but missing spec.md: ${matchingDir}`,
    });
  }

  return errors;
}

/** Check required, feature-implied, and optional dependencies */
export function checkDependencies(
  module: DiscoveredModule,
  packageDirs: string[],
  logger: RegistryLogger,
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const pkg of module.config.requires.packages) {
    if (!packageDirs.includes(pkg)) {
      errors.push({
        module: module.name,
        code: MODULE_REGISTRY_ERRORS.DEPENDENCY_MISSING,
        message: `Required package missing: ${pkg}`,
      });
    }
  }

  const features = module.config.features;
  for (const [feature, pkg] of Object.entries(FEATURE_PACKAGE_MAP)) {
    const featureKey = feature as keyof typeof features;
    if (features[featureKey] && !packageDirs.includes(pkg)) {
      errors.push({
        module: module.name,
        code: MODULE_REGISTRY_ERRORS.DEPENDENCY_MISSING,
        message: `Feature ${feature} requires package ${pkg} which is not available`,
      });
    }
  }

  for (const pkg of module.config.requires.optional) {
    if (!packageDirs.includes(pkg)) {
      logger.warn({ msg: 'Optional package not available', module: module.name, package: pkg });
    }
  }

  return errors;
}
