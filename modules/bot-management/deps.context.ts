import type { ModuleDeps } from './index.js';

let moduleDeps: ModuleDeps | null = null;

export function registerDeps(deps: ModuleDeps): void {
  moduleDeps = deps;
}

export function getDeps(): ModuleDeps {
  if (!moduleDeps) {
    throw new Error('bot-management: deps not registered. Call registerDeps first.');
  }
  return moduleDeps;
}

export function getI18n(): ModuleDeps['i18n'] {
  return getDeps().i18n;
}

export function getAuthorization(): ModuleDeps['authorization'] {
  return getDeps().authorization;
}

export function getLogger(): ModuleDeps['logger'] {
  return getDeps().logger;
}
