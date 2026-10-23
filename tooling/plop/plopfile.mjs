/**
 * Sovereign Plop.js CLI Generator for Tembot-v2.
 * Enforces vertical slice architecture, strict engineering taboos,
 * and automatic wiring of logging, error handling, and audit trails.
 */
export default function (plop) {
  plop.setHelper('eq', (a, b) => a === b);

  plop.setGenerator('module', {
    description: 'Scaffold a new sovereign modular monolith module (domain or kernel)',
    prompts: [
      {
        type: 'list',
        name: 'category',
        message: 'Module category:',
        choices: ['domain', 'kernel'],
        default: 'domain',
      },
      {
        type: 'input',
        name: 'name',
        message: 'Module name (kebab-case, e.g. loyalty-engine):',
        validate: (input) => (/^[a-z0-9-]+$/.test(input) ? true : 'Must be kebab-case'),
      },
      {
        type: 'input',
        name: 'context',
        message: 'Bounded context cluster (e.g. commerce-hub, operations-hub):',
        default: 'domain-hub',
      },
      {
        type: 'input',
        name: 'description',
        message: 'Module description:',
        default: 'Domain module for tembot-v2',
      },
    ],
    actions: [
      {
        type: 'add',
        path: '../../modules/{{category}}/{{dashCase name}}/package.json',
        templateFile: 'templates/module/package.json.hbs',
      },
      {
        type: 'add',
        path: '../../modules/{{category}}/{{dashCase name}}/tsconfig.json',
        templateFile: 'templates/module/tsconfig.json.hbs',
      },
      {
        type: 'add',
        path: '../../modules/{{category}}/{{dashCase name}}/src/module.manifest.ts',
        templateFile: 'templates/module/manifest.ts.hbs',
      },
      {
        type: 'add',
        path: '../../modules/{{category}}/{{dashCase name}}/src/db/schema.ts',
        templateFile: 'templates/module/schema.ts.hbs',
      },
      {
        type: 'add',
        path: '../../modules/{{category}}/{{dashCase name}}/src/index.ts',
        templateFile: 'templates/module/index.ts.hbs',
      },
    ],
  });

  plop.setGenerator('slice', {
    description: 'Scaffold a vertical slice inside an existing module',
    prompts: [
      {
        type: 'input',
        name: 'targetModule',
        message: 'Target module relative path (e.g. modules/domain/loyalty-engine):',
        validate: (input) => (input.trim().length > 0 ? true : 'Module path required'),
      },
      {
        type: 'input',
        name: 'name',
        message: 'Slice name (kebab-case, e.g. issue-points):',
        validate: (input) => (/^[a-z0-9-]+$/.test(input) ? true : 'Must be kebab-case'),
      },
      {
        type: 'list',
        name: 'kind',
        message: 'Slice kind:',
        choices: ['interactive', 'headless'],
        default: 'interactive',
      },
    ],
    actions: [
      {
        type: 'add',
        path: '../../{{targetModule}}/src/slices/{{dashCase name}}/dto.ts',
        templateFile: 'templates/slice/dto.ts.hbs',
      },
      {
        type: 'add',
        path: '../../{{targetModule}}/src/slices/{{dashCase name}}/action.ts',
        templateFile: 'templates/slice/action.ts.hbs',
      },
      {
        type: 'add',
        path: '../../{{targetModule}}/src/slices/{{dashCase name}}/index.ts',
        templateFile: 'templates/slice/index.ts.hbs',
      },
    ],
  });
}
