import type { ModuleDeps } from './index.js';

let moduleDeps: ModuleDeps | null = null;

export function registerDeps(deps: ModuleDeps): void {
  moduleDeps = deps;
}

export function getDeps(): ModuleDeps {
  if (!moduleDeps) {
    throw new Error('template-management: deps not registered. Call registerDeps first.');
  }
  return moduleDeps;
}
