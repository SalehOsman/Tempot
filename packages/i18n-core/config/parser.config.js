/**
 * i18next-parser configuration for Tempot.
 *
 * Scans TypeScript source files for `t()` function calls and extracts
 * translation keys into per-module locale JSON files.
 *
 * Usage: npx i18next-parser --config packages/i18n-core/config/parser.config.js
 *
 * @see https://github.com/i18next/i18next-parser
 */
module.exports = {
  // Contexts for pluralization etc.
  contextSeparator: '_',

  // Default namespace used when namespace is not specified
  defaultNamespace: 'common',

  // Default translation value (empty string forces developer to fill it)
  defaultValue: '',

  // Indentation for JSON output
  indentation: 2,

  // Keep removed keys (false = clean up unused keys)
  keepRemoved: false,

  // Key separator for nested keys
  keySeparator: '.',

  // Namespace separator
  namespaceSeparator: ':',

  // Supported languages
  locales: ['ar', 'en'],

  // Output path pattern: modules/{namespace}/locales/{locale}.json
  output: 'modules/$NAMESPACE/locales/$LOCALE.json',

  // Input file patterns to scan for t() calls
  input: [
    'packages/*/src/**/*.ts',
    'apps/*/src/**/*.ts',
    'apps/*/src/**/*.tsx',
    'modules/*/src/**/*.ts',
  ],

  // Sort keys alphabetically in output
  sort: true,

  // Use key as default value (helps identify untranslated keys)
  useKeysAsDefaultValue: false,

  // Verbose output
  verbose: false,

  // Functions to look for when extracting keys
  lexers: {
    ts: [
      {
        lexer: 'JavascriptLexer',
        functions: ['t'],
      },
    ],
    tsx: [
      {
        lexer: 'JsxLexer',
        functions: ['t'],
      },
    ],
  },
};
