# Data Model: Module Development Platform

This documentation spec introduces conceptual records for future tooling. It
does not create database schema or runtime data.

## Module Blueprint

- `name`: Blueprint identifier such as `basic`, `crud`, or `searchable`.
- `purpose`: Why the blueprint exists.
- `generatedArtifacts`: Files, folders, tests, and docs the generator should
  create.
- `requiredCapabilities`: Package capabilities needed by the blueprint.
- `validationGates`: Commands that prove the generated module is valid.

## Capability Pack

- `name`: Pack identifier such as `Search pack` or `CMS pack`.
- `packageDependency`: The package that provides the capability.
- `requiredFiles`: Files normally added to the module.
- `requiredTests`: Test categories required for the capability.
- `forbiddenShortcuts`: Patterns the pack prevents, such as direct Telegram
  notification calls or direct module imports.

## Module Manifest

- `moduleName`: Kebab-case module name.
- `moduleType`: Core platform, operational, product, integration, or example.
- `capabilities`: Selected capabilities from the catalog.
- `commands`: Command entry points.
- `events`: Published and consumed event contracts.
- `permissions`: Ability and role requirements.
- `settings`: Settings keys owned by the module.
- `cmsNamespaces`: CMS namespaces owned by the module.
- `dataOwnership`: Repository and migration ownership.

## RAG Assistant Source

- `sourcePath`: Repository path used as retrievable content.
- `authorityLevel`: Constitution, role framework, catalog, package README, or
  active SpecKit artifact.
- `freshnessPolicy`: When the source must be re-indexed.
- `citationRequired`: Whether answers must cite the source.
