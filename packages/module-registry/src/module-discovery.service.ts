import { ok } from 'neverthrow';
import type { AsyncResult } from '@tempot/shared';
import { moduleConfigSchema } from './module-config.schema.js';
import type {
  DiscoveredModule,
  DiscoveryResult,
  ModuleDiscoveryPort,
  RegistryLogger,
} from './module-registry.types.js';

/** Dependencies injected into ModuleDiscovery (DC-1) */
export interface ModuleDiscoveryDeps {
  modulesDir: string;
  loadConfig: (path: string) => Promise<unknown>;
  listDir: (path: string) => Promise<string[]>;
  isDirectory: (path: string) => Promise<boolean>;
  logger: RegistryLogger;
}

/**
 * Scans a modules directory and loads module.config.ts from each subdirectory.
 * Validates configs against the zod schema and skips inactive modules.
 */
export class ModuleDiscovery implements ModuleDiscoveryPort {
  private readonly deps: ModuleDiscoveryDeps;

  constructor(deps: ModuleDiscoveryDeps) {
    this.deps = deps;
  }

  async discover(): AsyncResult<DiscoveryResult> {
    const discovered: DiscoveredModule[] = [];
    const skipped: string[] = [];
    const failed: Array<{ path: string; error: string }> = [];

    const entries = await this.listModulesDir();
    if (entries === null) {
      return ok({ discovered, skipped, failed });
    }

    const directories = await this.filterDirectories(entries);

    for (const dirName of directories) {
      const modulePath = `${this.deps.modulesDir}/${dirName}`;
      const configPath = `${modulePath}/module.config.ts`;

      const loadResult = await this.loadModuleConfig(configPath);
      if (!loadResult.ok) {
        failed.push({ path: modulePath, error: loadResult.error });
        continue;
      }
      const loaded = loadResult.value;

      const rawConfig = this.extractConfig(loaded);
      const parsed = moduleConfigSchema.safeParse(rawConfig);

      if (!parsed.success) {
        failed.push({
          path: modulePath,
          error: `Config validation failed: ${parsed.error.message}`,
        });
        continue;
      }

      const config = parsed.data;

      if (!config.isActive) {
        skipped.push(config.name);
        this.deps.logger.info({ msg: 'Module inactive, skipping', module: config.name });
        continue;
      }

      discovered.push({ name: config.name, path: modulePath, config });
      this.deps.logger.debug({ msg: 'Module discovered', module: config.name });
    }

    return ok({ discovered, skipped, failed });
  }

  private async listModulesDir(): Promise<string[] | null> {
    try {
      return await this.deps.listDir(this.deps.modulesDir);
    } catch (error: unknown) {
      const fsError = error as { code?: string };
      if (fsError.code === 'ENOENT') {
        this.deps.logger.info({ msg: 'Modules directory not found', path: this.deps.modulesDir });
        return null;
      }
      this.deps.logger.warn({
        msg: 'Failed to read modules directory',
        path: this.deps.modulesDir,
        error,
      });
      return null;
    }
  }

  private async filterDirectories(entries: string[]): Promise<string[]> {
    const results: string[] = [];
    for (const entry of entries) {
      const fullPath = `${this.deps.modulesDir}/${entry}`;
      const isDir = await this.deps.isDirectory(fullPath);
      if (isDir) {
        results.push(entry);
      }
    }
    return results;
  }

  private async loadModuleConfig(
    configPath: string,
  ): Promise<{ ok: true; value: unknown } | { ok: false; error: string }> {
    try {
      const value = await this.deps.loadConfig(configPath);
      return { ok: true, value };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.deps.logger.warn({
        msg: 'Failed to load module config',
        path: configPath,
        error: message,
      });
      return { ok: false, error: message };
    }
  }

  private extractConfig(loaded: unknown): unknown {
    if (loaded !== null && typeof loaded === 'object' && 'default' in loaded) {
      return (loaded as Record<string, unknown>)['default'];
    }
    return loaded;
  }
}
