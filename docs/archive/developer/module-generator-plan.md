# Tempot Module Generator Plan

**Status**: Initial internal generator implemented for spec #026
**Purpose**: Define a governed generator for new business modules.

## Command Shape

Initial internal target:

```powershell
pnpm tempot module create <module-name>
```

Future public wrapper:

```powershell
create-tempot-bot module create <module-name>
```

## Generated Structure

```text
modules/{module-name}/
|-- package.json
|-- tsconfig.json
|-- vitest.config.ts
|-- .gitignore
|-- index.ts
|-- module.config.ts
|-- abilities.ts
|-- commands/
|-- handlers/
|-- services/
|-- repositories/
|-- events/
|-- contracts/
|-- shared/
|-- types/
|-- locales/
|   |-- ar.json
|   `-- en.json
`-- tests/
```

Generate optional folders only when selected by flags.

## Implemented Initial Mode

The initial internal command is available through the root workspace script:

```powershell
pnpm tempot module create <module-name>
```

It currently generates the minimal inactive module skeleton:

- `package.json` with `main`, `types`, `exports`, `build`, and `test`.
- `tsconfig.json` using the repository base TypeScript config.
- `vitest.config.ts` for package-level tests.
- `.gitignore` for build output.
- `index.ts`, `module.config.ts`, and `abilities.ts`.
- `features/index.ts` and `shared/index.ts` required by module validation.
- `locales/ar.json` and `locales/en.json` starter resources.
- `tests/module.config.test.ts`.

The command accepts only kebab-case names such as `person-registration` and refuses to overwrite an existing `modules/{module-name}` directory.

## Required Defaults

- TypeScript strict.
- `main` points to `dist/index.js`.
- `types` points to `dist/index.d.ts`.
- `exports` exposes the package root.
- `build` uses `tsc`.
- `test` uses Vitest.
- `.gitignore` excludes `dist/`, generated JavaScript, and declaration output.
- Locale files include starter keys in Arabic and English.

## Generator Inputs

- Module name.
- Display name translation keys.
- Whether database repository is needed.
- Whether auth abilities are needed.
- Whether commands and menus are needed.
- Whether events are published.
- Whether input-engine forms are needed.

## Validation After Generation

The generator should run or print:

```powershell
pnpm --filter @tempot/{module-name} test
pnpm --filter @tempot/{module-name} build
pnpm cms:check
pnpm spec:validate
git diff --check
```

## Non-Goals

- Do not generate business logic beyond a minimal placeholder.
- Do not bypass SpecKit artifacts.
- Do not create modules without tests.
- Do not activate deferred packages automatically.
