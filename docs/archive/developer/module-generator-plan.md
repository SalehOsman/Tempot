# Tempot Module Generator Plan

**Status**: Internal generator active; blueprint and manifest foundation
implemented by Spec #037
**Purpose**: Define a governed generator for new business modules.

The generator direction is governed by
`docs/archive/developer/module-development-catalog.md`.

## Command Shape

Initial internal target:

```powershell
pnpm tempot module create <module-name>
pnpm tempot module create <module-name> --type <type> --blueprint basic
pnpm tempot module doctor <module-name>
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
|-- module.manifest.ts
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

## Implemented Mode

The initial internal command is available through the root workspace script:

```powershell
pnpm tempot module create <module-name>
pnpm tempot module create <module-name> --type <type> --blueprint basic
```

It currently generates the minimal inactive module skeleton:

- `package.json` with `main`, `types`, `exports`, `build`, and `test`.
- `tsconfig.json` using the repository base TypeScript config.
- `vitest.config.ts` for package-level tests.
- `.gitignore` for build output.
- `index.ts`, `module.config.ts`, and `abilities.ts`.
- `module.manifest.ts` with module name, type, blueprint, inactive status,
  empty capabilities, empty commands, and empty event lists.
- `features/index.ts` and `shared/index.ts` required by module validation.
- `locales/ar.json` and `locales/en.json` starter resources.
- `tests/module.config.test.ts` and `tests/module.manifest.test.ts`.

The command accepts only kebab-case names such as `person-registration`, refuses
to overwrite an existing `modules/{module-name}` directory, accepts module types
`core-platform`, `operational`, `product`, `integration`, and `example`, and
supports only the `basic` blueprint in this slice.

The module readiness command is also available:

```powershell
pnpm tempot module doctor <module-name>
```

It checks module directory existence, required files, package metadata, locale
key parity, and direct imports from another module.

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

- Module name through `<module-name>`.
- Module type through `--type <type>`, defaulting to `product`.
- Blueprint selection through `--blueprint basic`, defaulting to `basic`.
- Capability pack selection.
- Display name translation keys.
- Whether database repository is needed.
- Whether auth abilities are needed.
- Whether commands and menus are needed.
- Whether events are published.
- Whether input-engine forms are needed.

## Blueprint Direction

Future generator work should support blueprint presets:

- `basic`
- `crud`
- `workflow`
- `searchable`
- `importable`
- `exportable`
- `notifiable`
- `cms-enabled`
- `ai-assisted`
- `admin-managed`

Blueprints define the initial module shape. Capability packs can then extend an
existing module after the first merge.

## Capability Pack Direction

Future capability packs should add focused, reviewable slices:

- Auth pack
- Event pack
- Repository pack
- Search pack
- Import pack
- Export pack
- Notification pack
- CMS pack
- AI pack

Each pack must add tests, documentation, and validation gates with the files it
introduces.

## Manifest Direction

The generator creates `module.manifest.ts` as the starter declarative source for
module metadata. Future work should extend the manifest toward capabilities,
events, permissions, settings, CMS namespaces, and owned data.

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
- Do not generate AI behavior that bypasses grounding, citations, audit, or
  access policy.
