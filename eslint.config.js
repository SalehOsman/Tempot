import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import checkFilePlugin from 'eslint-plugin-check-file';
import boundaries from 'eslint-plugin-boundaries';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    plugins: {
      'check-file': checkFilePlugin,
      boundaries,
    },
    settings: {
      // ADR-035: Package boundary classification (four tiers)
      // Patterns match packages/** (not just src/) because resolved imports
      // go through dist/ (via eslint-import-resolver-typescript).
      'boundaries/elements': [
        // Tier 1: Foundation â€” imports nothing
        { type: 'foundation', pattern: ['packages/shared/**'], capture: ['path'] },
        // Tier 2: Infrastructure â€” imports Tier 1 + other Tier 2
        {
          type: 'infrastructure',
          pattern: ['packages/{database,event-bus,logger,sentry}/**'],
          capture: ['path'],
        },
        // Tier 3: Cross-cutting â€” imports Tier 1 + Tier 2
        {
          type: 'cross-cutting',
          pattern: ['packages/{i18n-core,auth-core,interaction-observability}/**'],
          capture: ['path'],
        },
        // Tier 4: Domain â€” imports Tier 1 + Tier 2 + Tier 3 (NOT other Tier 4)
        {
          type: 'domain',
          pattern: ['packages/*/**'],
          capture: ['path'],
        },
      ],
      // Import resolver: resolves @tempot/* workspace packages to real file paths
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
      'boundaries/ignore': [
        // Test files are not subject to boundary rules
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/tests/**',
      ],
    },
    rules: {
      // Constitution Rule III â€” BANNED filenames
      'check-file/filename-blocklist': [
        'error',
        {
          '**/*utils*.ts': '*.ts',
          '**/*helpers*.ts': '*.ts',
          '**/*misc*.ts': '*.ts',
          '**/*common*.ts': '*.ts',
        },
      ],

      // Constitution Rule I â€” no `any` types
      '@typescript-eslint/no-explicit-any': 'error',

      // Constitution Rule II â€” enforce code size limits
      'max-lines': ['error', { max: 200, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['error', { max: 50, skipBlankLines: true, skipComments: true }],
      'max-params': ['error', 3],

      // Constitution Rule VIII â€” no commented-out code
      'no-warning-comments': ['warn', { terms: ['todo', 'fixme', 'hack'], location: 'start' }],

      // Constitution Rule X â€” no empty catch blocks
      'no-empty': ['error', { allowEmptyCatch: false }],

      // Constitution Rule LXXIV â€” no console.* in production code
      'no-console': 'error',

      // Constitution Rule I â€” no @ts-ignore or @ts-expect-error bypasses
      '@typescript-eslint/ban-ts-comment': 'error',

      // Allow empty interfaces for declaration merging patterns
      '@typescript-eslint/no-empty-object-type': ['error', { allowInterfaces: 'always' }],

      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

      // ADR-035: Package import boundary enforcement
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          rules: [
            // Foundation (Tier 1): cannot import any @tempot package
            // (no rules = default disallow)

            // Infrastructure (Tier 2): can import Foundation + other Infrastructure
            {
              from: { type: 'infrastructure' },
              allow: [{ to: { type: 'foundation' } }, { to: { type: 'infrastructure' } }],
            },

            // Cross-cutting (Tier 3): can import Foundation + Infrastructure
            {
              from: { type: 'cross-cutting' },
              allow: [{ to: { type: 'foundation' } }, { to: { type: 'infrastructure' } }],
            },

            // Domain (Tier 4): can import Foundation + Infrastructure + Cross-cutting
            {
              from: { type: 'domain' },
              allow: [
                { to: { type: 'foundation' } },
                { to: { type: 'infrastructure' } },
                { to: { type: 'cross-cutting' } },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    // Test files get relaxed rules
    files: ['**/*.test.ts', '**/*.spec.ts'],
    rules: {
      'max-lines': 'off',
      'max-lines-per-function': 'off',
      'no-console': 'off',
    },
  },
  {
    ignores: [
      'tempot-github-template-clean/**',
      '.agents/**',
      '.claude/**',
      '.gemini/**',
      '.opencode/**',
      '.windsurf/**',
      '.specify/**',
      '.changeset/**',
      '.husky/**',
      'specs/**',
      'docs/archive/**',
      'docs/architecture/**',
      'docs/developer/**',
      'docs/development/**',
      'docs/project-analysis/**',
      'docs/superpowers/**',
      'docs/prompt/**',
      'scripts/ci/**',
      'scripts/spec-validate/**',
      'scripts/security/**',
      'scripts/operations/**',
      '**/tests/**',
      '**/*.test.ts',
      '**/*.spec.ts',
      'dist/**',
      'node_modules/**',
      'coverage/**',
      '**/*.generated.ts',
      '.worktrees/**',
      '.understand-anything/**',
      '**/dist/**',
      // Compiled JS artifacts in source/test directories (generated by tsc, not source code)
      'packages/*/tests/**/*.js',
      'packages/*/tests/**/*.d.ts',
      'packages/database/drizzle.config.js',
      'packages/database/scripts/merge-schemas.js',
      'packages/i18n-core/config/parser.config.js',
      // Compiled vitest configs
      'packages/*/vitest.config.js',
      // Generated type declarations
      'vitest.workspace.d.ts',
      // Astro generated output
      'apps/docs/.astro/**',
    ],
  },
);
