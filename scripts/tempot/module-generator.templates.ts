import type { GeneratedModuleFile } from './module-generator.types.js';

export function buildModuleFiles(moduleName: string): readonly GeneratedModuleFile[] {
  return [
    { path: 'package.json', content: packageJson(moduleName) },
    { path: 'tsconfig.json', content: tsconfigJson() },
    { path: 'vitest.config.ts', content: vitestConfig() },
    { path: '.gitignore', content: gitignore() },
    { path: 'index.ts', content: indexTs(moduleName) },
    { path: 'module.config.ts', content: moduleConfigTs(moduleName) },
    { path: 'abilities.ts', content: abilitiesTs(moduleName) },
    { path: 'features/index.ts', content: emptyBarrel() },
    { path: 'shared/index.ts', content: emptyBarrel() },
    { path: 'locales/ar.json', content: localeJson(moduleName, 'ar') },
    { path: 'locales/en.json', content: localeJson(moduleName, 'en') },
    { path: 'tests/module.config.test.ts', content: moduleConfigTestTs(moduleName) },
  ];
}

function packageJson(moduleName: string): string {
  return `${JSON.stringify(
    {
      name: `@tempot/${moduleName}`,
      version: '0.1.0',
      private: true,
      type: 'module',
      main: 'dist/index.js',
      types: 'dist/index.d.ts',
      exports: {
        '.': {
          types: './dist/index.d.ts',
          import: './dist/index.js',
        },
      },
      scripts: {
        build: 'tsc',
        test: 'vitest run',
        'test:watch': 'vitest',
      },
      dependencies: {
        '@tempot/module-registry': 'workspace:*',
      },
      peerDependencies: {
        grammy: '^1.41.1',
      },
      devDependencies: {
        grammy: '^1.41.1',
        typescript: '5.9.3',
        vitest: '4.1.0',
      },
    },
    null,
    2,
  )}\n`;
}

function tsconfigJson(): string {
  return `${JSON.stringify(
    {
      extends: '../../tsconfig.json',
      compilerOptions: {
        outDir: 'dist',
        rootDir: '.',
        composite: false,
        noEmit: false,
        declaration: true,
        declarationMap: true,
        sourceMap: false,
      },
      include: [
        'module.config.ts',
        'index.ts',
        'abilities.ts',
        'features/**/*.ts',
        'shared/**/*.ts',
        'tests/**/*.ts',
      ],
      exclude: ['dist', 'node_modules'],
    },
    null,
    2,
  )}\n`;
}

function vitestConfig(): string {
  return [
    "import { defineConfig } from 'vitest/config';",
    '',
    'export default defineConfig({',
    '  test: {',
    "    include: ['tests/**/*.test.ts'],",
    "    environment: 'node',",
    '  },',
    '});',
    '',
  ].join('\n');
}

function gitignore(): string {
  return [
    'dist/',
    'node_modules/',
    '*.tsbuildinfo',
    '*.js',
    '*.js.map',
    '*.d.ts',
    '*.d.ts.map',
    '',
  ].join('\n');
}

function indexTs(moduleName: string): string {
  const exportName = camelCase(`${moduleName}-abilities`);

  return [
    `import { ${exportName} } from './abilities.js';`,
    '',
    'const setup = async (): Promise<void> => {};',
    '',
    'export default setup;',
    `export { ${exportName} };`,
    '',
  ].join('\n');
}

function moduleConfigTs(moduleName: string): string {
  return [
    "import type { ModuleConfig } from '@tempot/module-registry';",
    '',
    'const config: ModuleConfig = {',
    `  name: '${moduleName}',`,
    "  version: '0.1.0',",
    "  requiredRole: 'USER',",
    '  isActive: false,',
    '  isCore: false,',
    '  commands: [],',
    '  features: {',
    '    hasDatabase: false,',
    '    hasNotifications: false,',
    '    hasAttachments: false,',
    '    hasExport: false,',
    '    hasAI: false,',
    '    hasInputEngine: false,',
    '    hasImport: false,',
    '    hasSearch: false,',
    '    hasDynamicCMS: false,',
    '    hasRegional: false,',
    '  },',
    '  requires: {',
    '    packages: [],',
    '    optional: [],',
    '  },',
    '};',
    '',
    'export default config;',
    '',
  ].join('\n');
}

function abilitiesTs(moduleName: string): string {
  return [`export const ${camelCase(`${moduleName}-abilities`)} = [] as const;`, ''].join('\n');
}

function emptyBarrel(): string {
  return ['export {};', ''].join('\n');
}

function localeJson(moduleName: string, locale: 'ar' | 'en'): string {
  const title = locale === 'ar' ? 'وحدة جديدة' : 'New Module';
  const ready = locale === 'ar' ? 'الوحدة جاهزة للتخصيص.' : 'The module is ready to customize.';

  return `${JSON.stringify({ [moduleName]: { title, ready } }, null, 2)}\n`;
}

function moduleConfigTestTs(moduleName: string): string {
  return [
    "import { describe, expect, it } from 'vitest';",
    "import config from '../module.config.js';",
    '',
    `describe('${moduleName} module config', () => {`,
    '  it("should start inactive until explicitly wired", () => {',
    `    expect(config.name).toBe('${moduleName}');`,
    '    expect(config.isActive).toBe(false);',
    '    expect(config.isCore).toBe(false);',
    '  });',
    '});',
    '',
  ].join('\n');
}

function camelCase(value: string): string {
  return value.replace(/-([a-z0-9])/g, (_, char: string) => char.toUpperCase());
}
