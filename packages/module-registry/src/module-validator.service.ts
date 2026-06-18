import { ok } from 'neverthrow';
import type { AsyncResult } from '@tempot/shared';
import { MODULE_REGISTRY_ERRORS } from './module-registry.errors.js';
import { checkDependencies, checkSpecGate, checkStructure } from './module-validator.checks.js';
import type {
  DiscoveredModule,
  ModuleValidatorPort,
  RegistryLogger,
  RuntimeModuleManifest,
  ValidatedModule,
  ValidationError,
  ValidationResult,
} from './module-registry.types.js';

/** Dependencies injected into ModuleValidator */
export interface ModuleValidatorDeps {
  specsDir: string;
  packagesDir: string;
  runtimeManifest?: RuntimeModuleManifest;
  listDir: (path: string) => Promise<string[]>;
  pathExists: (path: string) => Promise<boolean>;
  logger: RegistryLogger;
}

/**
 * Validates discovered modules against structural, spec gate,
 * and dependency requirements. Error accumulation (DC-5).
 */
export class ModuleValidator implements ModuleValidatorPort {
  private readonly deps: ModuleValidatorDeps;

  constructor(deps: ModuleValidatorDeps) {
    this.deps = deps;
  }

  async validate(discovered: DiscoveredModule[]): AsyncResult<ValidationResult> {
    const validated: ValidatedModule[] = [];
    const skipped: string[] = [];
    const failed: ValidationError[] = [];

    const specDirs = await this.listSpecDirs();
    const packageDirs = await this.listPackageDirs();
    const seenNames = new Set<string>();

    for (const module of discovered) {
      const errors = await this.validateModule(module, {
        specDirs,
        packageDirs,
        seenNames,
      });

      if (errors.length > 0) {
        failed.push(...errors);
      } else {
        validated.push({
          name: module.name,
          path: module.path,
          config: module.config,
          validatedAt: new Date(),
        });
      }

      seenNames.add(module.name);
    }

    return ok({ validated, skipped, failed });
  }

  private async validateModule(
    module: DiscoveredModule,
    ctx: { specDirs: string[]; packageDirs: string[]; seenNames: Set<string> },
  ): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    const manifestModule = this.manifestModule(module.name);

    if (ctx.seenNames.has(module.name)) {
      errors.push({
        module: module.name,
        code: MODULE_REGISTRY_ERRORS.DUPLICATE_NAME,
        message: `Duplicate module name: ${module.name}`,
      });
    }

    if (this.deps.runtimeManifest && !manifestModule) {
      errors.push({
        module: module.name,
        code: MODULE_REGISTRY_ERRORS.STRUCTURE_INVALID,
        message: `Module missing from runtime manifest: ${module.name}`,
      });
    }

    if (!this.deps.runtimeManifest) {
      const structureErrors = await checkStructure(module, this.deps.pathExists, this.deps.logger);
      errors.push(...structureErrors);
    }

    if (!this.deps.runtimeManifest) {
      const specErrors = await checkSpecGate(module, {
        specDirs: ctx.specDirs,
        specsDir: this.deps.specsDir,
        pathExists: this.deps.pathExists,
      });
      errors.push(...specErrors);
    }

    const depErrors = checkDependencies(module, ctx.packageDirs, this.deps.logger);
    errors.push(...depErrors);

    return errors;
  }

  private async safeListDir(path: string): Promise<string[]> {
    try {
      return await this.deps.listDir(path);
    } catch {
      return [];
    }
  }

  private listSpecDirs(): Promise<string[]> {
    const manifest = this.deps.runtimeManifest;
    if (manifest) {
      return Promise.resolve(manifest.modules.map((module) => module.specDir));
    }
    return this.safeListDir(this.deps.specsDir);
  }

  private listPackageDirs(): Promise<string[]> {
    const manifest = this.deps.runtimeManifest;
    if (manifest) {
      return Promise.resolve(manifest.packages);
    }
    return this.safeListDir(this.deps.packagesDir);
  }

  private manifestModule(moduleName: string): RuntimeModuleManifest['modules'][number] | undefined {
    return this.deps.runtimeManifest?.modules.find((module) => module.name === moduleName);
  }
}
