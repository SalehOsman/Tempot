import type { AbilityDefinition } from '@tempot/auth-core';

export class AbilityRegistry {
  private readonly definitionsByModule = new Map<string, AbilityDefinition>();
  private readonly runtimeDefinitions: AbilityDefinition[] = [];

  register(moduleName: string, definition: AbilityDefinition): void {
    this.definitionsByModule.set(moduleName, definition);
    this.runtimeDefinitions.splice(
      0,
      this.runtimeDefinitions.length,
      ...this.definitionsByModule.values(),
    );
  }

  getRuntimeDefinitions(): AbilityDefinition[] {
    return this.runtimeDefinitions;
  }

  snapshot(): AbilityDefinition[] {
    return [...this.runtimeDefinitions];
  }
}
