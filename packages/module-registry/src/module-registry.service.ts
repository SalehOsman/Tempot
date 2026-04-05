import { ok, err } from 'neverthrow';
import { AppError } from '@tempot/shared';
import type { AsyncResult } from '@tempot/shared';
import { MODULE_REGISTRY_ERRORS } from './module-registry.errors.js';
import type {
  DiscoveredModule,
  DiscoveryResult,
  ModuleCommand,
  ModuleDiscoveryPort,
  ModuleValidatorPort,
  RegistryBot,
  RegistryEventBus,
  RegistryLogger,
  ValidatedModule,
  ValidationResult,
} from './module-registry.types.js';

/** Dependencies injected into ModuleRegistry */
export interface ModuleRegistryDeps {
  discovery: ModuleDiscoveryPort;
  validator: ModuleValidatorPort;
  eventBus: RegistryEventBus;
  logger: RegistryLogger;
}

/**
 * Orchestrates the discover-validate-register pipeline
 * and provides a query interface for validated modules.
 */
export class ModuleRegistry {
  private readonly deps: ModuleRegistryDeps;
  private discoveredModules: DiscoveredModule[] | null = null;
  private registry: Map<string, ValidatedModule> = new Map();

  constructor(deps: ModuleRegistryDeps) {
    this.deps = deps;
  }

  async discover(): AsyncResult<DiscoveryResult> {
    const result = await this.deps.discovery.discover();
    if (result.isErr()) return result;

    const discovery = result.value;
    this.discoveredModules = discovery.discovered;

    await this.emitEvent('module-registry.discovery.completed', {
      modulesFound: discovery.discovered.length,
      modulesSkipped: discovery.skipped.length,
      modulesFailed: discovery.failed.length,
    });

    this.deps.logger.info({
      msg: 'Discovery completed',
      found: discovery.discovered.length,
      skipped: discovery.skipped.length,
      failed: discovery.failed.length,
    });

    return ok(discovery);
  }

  async validate(): AsyncResult<ValidationResult> {
    if (this.discoveredModules === null) {
      return err(new AppError(MODULE_REGISTRY_ERRORS.NOT_DISCOVERED));
    }

    const result = await this.deps.validator.validate(this.discoveredModules);
    if (result.isErr()) return result;

    const validation = result.value;
    return this.processValidation(validation);
  }

  async register(bot: RegistryBot): AsyncResult<void> {
    if (this.registry.size === 0 && this.discoveredModules !== null) {
      return err(new AppError(MODULE_REGISTRY_ERRORS.NOT_VALIDATED));
    }
    if (this.discoveredModules === null) {
      return err(new AppError(MODULE_REGISTRY_ERRORS.NOT_VALIDATED));
    }

    const allCommands = this.getAllCommands();
    try {
      await bot.api.setMyCommands(allCommands);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new AppError(MODULE_REGISTRY_ERRORS.REGISTRATION_FAILED, { error: message }));
    }

    for (const module of this.registry.values()) {
      await this.emitEvent('module-registry.module.registered', {
        moduleName: module.name,
        commandCount: module.config.commands.length,
      });
    }

    return ok(undefined);
  }

  getModule(name: string): ValidatedModule | undefined {
    return this.registry.get(name);
  }

  getAllModules(): ValidatedModule[] {
    return [...this.registry.values()];
  }

  getAllCommands(): ModuleCommand[] {
    const commands: ModuleCommand[] = [];
    for (const module of this.registry.values()) {
      commands.push(...module.config.commands);
    }
    return commands;
  }

  private async processValidation(validation: ValidationResult): AsyncResult<ValidationResult> {
    for (const module of validation.validated) {
      this.registry.set(module.name, module);
      await this.emitEvent('module-registry.module.validated', {
        moduleName: module.name,
        isCore: module.config.isCore,
      });
    }

    const failedCoreModules = this.findFailedCoreModules(validation);
    await this.emitFailureEvents(validation);

    this.deps.logger.info({
      msg: 'Validation completed',
      validated: validation.validated.length,
      skipped: validation.skipped.length,
      failed: validation.failed.length,
    });

    if (failedCoreModules.length > 0) {
      return err(
        new AppError(MODULE_REGISTRY_ERRORS.CORE_MODULE_FAILED, {
          modules: failedCoreModules,
        }),
      );
    }

    if (validation.failed.length > 0) {
      this.deps.logger.warn({
        msg: 'Some optional modules failed validation',
        failed: validation.failed,
      });
    }

    return ok(validation);
  }

  private findFailedCoreModules(validation: ValidationResult): string[] {
    if (!this.discoveredModules) return [];
    const coreModules = new Set(
      this.discoveredModules.filter((m) => m.config.isCore).map((m) => m.name),
    );
    const failedNames = [...new Set(validation.failed.map((f) => f.module))];
    return failedNames.filter((name) => coreModules.has(name));
  }

  private async emitFailureEvents(validation: ValidationResult): Promise<void> {
    const failedModuleNames = [...new Set(validation.failed.map((f) => f.module))];
    for (const moduleName of failedModuleNames) {
      const moduleErrors = validation.failed.filter((f) => f.module === moduleName);
      await this.emitEvent('module-registry.module.validation_failed', {
        moduleName,
        errors: moduleErrors.map((e) => e.message),
      });
    }
  }

  private async emitEvent(event: string, payload: Record<string, unknown>): Promise<void> {
    try {
      await this.deps.eventBus.publish(event, payload);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.deps.logger.warn({ msg: 'Event emission failed', event, error: message });
    }
  }
}
