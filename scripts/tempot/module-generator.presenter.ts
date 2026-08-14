import type { ModuleCreateResult } from './module-generator.types.js';

export function renderModuleCreateResult(result: ModuleCreateResult): string {
  if (!result.ok) {
    return ['Tempot Module Generator', `[fail] ${result.error}`, ''].join('\n');
  }

  return [
    'Tempot Module Generator',
    `[pass] Created module: ${result.moduleName}`,
    'Created files:',
    ...result.createdFiles.map((file) => `  - ${file}`),
    '',
  ].join('\n');
}
