import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import checkFilePlugin from 'eslint-plugin-check-file';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    plugins: {
      'check-file': checkFilePlugin,
    },
    rules: {
      // Constitution Rule III — BANNED filenames
      'check-file/filename-blocklist': [
        'error',
        {
          '**/*utils*.ts': '*.ts',
          '**/*helpers*.ts': '*.ts',
          '**/*misc*.ts': '*.ts',
          '**/*common*.ts': '*.ts',
        },
      ],

      // Constitution Rule I — no `any` types
      '@typescript-eslint/no-explicit-any': 'error',

      // Constitution Rule II — enforce code size limits
      'max-lines': ['error', { max: 200, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['error', { max: 50, skipBlankLines: true, skipComments: true }],
      'max-params': ['error', 3],

      // Constitution Rule VIII — no commented-out code
      'no-warning-comments': ['warn', { terms: ['todo', 'fixme', 'hack'], location: 'start' }],

      // Constitution Rule X — no empty catch blocks
      'no-empty': ['error', { allowEmptyCatch: false }],

      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // Test files get relaxed rules
    files: ['**/*.test.ts', '**/*.spec.ts'],
    rules: {
      'max-lines': 'off',
      'max-lines-per-function': 'off',
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', '**/*.generated.ts'],
  },
);
