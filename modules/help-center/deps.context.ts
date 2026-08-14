import type { ModuleDeps } from './index.js';

let deps: ModuleDeps | null = null;

export function registerDeps(value: ModuleDeps): void {
  deps = value;
}

export function getDeps(): ModuleDeps {
  if (!deps) {
    throw new Error('[help-center] getDeps() called before registerDeps()');
  }
  return deps;
}
