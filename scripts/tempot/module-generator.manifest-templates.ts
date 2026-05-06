import type { ModuleTemplateOptions } from './module-generator.types.js';

export function moduleManifestTs(moduleName: string, options: ModuleTemplateOptions): string {
  return [
    'export const moduleManifest = {',
    `  name: '${moduleName}',`,
    `  type: '${options.moduleType}',`,
    `  blueprint: '${options.blueprint}',`,
    "  status: 'inactive',",
    '  capabilities: [] as const,',
    '  commands: [] as const,',
    '  events: {',
    '    publishes: [] as const,',
    '    consumes: [] as const,',
    '  },',
    '} as const;',
    '',
    'export type ModuleManifest = typeof moduleManifest;',
    '',
  ].join('\n');
}

export function moduleManifestTestTs(moduleName: string, options: ModuleTemplateOptions): string {
  return [
    "import { describe, expect, it } from 'vitest';",
    "import { moduleManifest } from '../module.manifest.js';",
    '',
    `describe('${moduleName} module manifest', () => {`,
    '  it("should describe the starter module metadata", () => {',
    `    expect(moduleManifest.name).toBe('${moduleName}');`,
    `    expect(moduleManifest.type).toBe('${options.moduleType}');`,
    `    expect(moduleManifest.blueprint).toBe('${options.blueprint}');`,
    "    expect(moduleManifest.status).toBe('inactive');",
    '  });',
    '});',
    '',
  ].join('\n');
}
