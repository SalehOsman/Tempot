import { Result, ok, err, DomainError } from '@tembot/shared-types';
import type { ModuleManifest, TembotModule } from './manifest.js';

export class RegistryError extends DomainError {
  public readonly code = 'REGISTRY_ERROR';
  public readonly httpStatus = 500;
}

export class KernelRegistry {
  private readonly modules = new Map<string, TembotModule>();

  public register(module: TembotModule): Result<void, RegistryError> {
    const id = module.manifest.id;
    if (this.modules.has(id)) {
      return err(new RegistryError(`Module '${id}' is already registered in KernelRegistry`));
    }
    this.modules.set(id, module);
    return ok(undefined);
  }

  public getModule(id: string): TembotModule | undefined {
    return this.modules.get(id);
  }

  public getAllModules(): readonly TembotModule[] {
    return Array.from(this.modules.values());
  }

  public getAllCapabilities(): readonly string[] {
    const set = new Set<string>();
    for (const mod of this.modules.values()) {
      for (const cap of mod.manifest.capabilities) {
        set.add(cap);
      }
    }
    return Array.from(set).sort();
  }

  /**
   * Validates that all required module dependencies are registered and that
   * the dependency graph forms a strict Directed Acyclic Graph (DAG).
   */
  public validateDependencyGraph(): Result<readonly string[], RegistryError> {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const order: string[] = [];

    // 1. Verify all required dependencies are present
    for (const [id, mod] of this.modules.entries()) {
      for (const req of mod.manifest.requires) {
        if (!this.modules.has(req)) {
          return err(
            new RegistryError(
              `Module '${id}' requires dependency '${req}', but '${req}' is not registered.`,
            ),
          );
        }
      }
    }

    // 2. Cycle detection via DFS
    const dfs = (id: string): Result<void, RegistryError> => {
      if (visiting.has(id)) {
        return err(new RegistryError(`Cyclic dependency detected involving module '${id}'`));
      }
      if (visited.has(id)) {
        return ok(undefined);
      }

      visiting.add(id);
      const mod = this.modules.get(id);
      if (mod) {
        for (const req of mod.manifest.requires) {
          const res = dfs(req);
          if (res.isErr()) return res;
        }
      }

      visiting.delete(id);
      visited.add(id);
      order.push(id);
      return ok(undefined);
    };

    for (const id of this.modules.keys()) {
      if (!visited.has(id)) {
        const res = dfs(id);
        if (res.isErr()) return res;
      }
    }

    return ok(order);
  }
}

export const globalRegistry = new KernelRegistry();
