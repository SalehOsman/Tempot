# Data Model: Module Tooling Foundation

This spec introduces TypeScript contracts for CLI tooling only. It does not
create database schema or runtime module state.

## Module Type

Allowed values:

- `core-platform`
- `operational`
- `product`
- `integration`
- `example`

Default: `product`

## Module Blueprint

Implemented values:

- `basic`

Catalog values reserved for future specs:

- `crud`
- `workflow`
- `searchable`
- `importable`
- `exportable`
- `notifiable`
- `cms-enabled`
- `ai-assisted`
- `admin-managed`

## Module Manifest

Generated file: `modules/{module-name}/module.manifest.ts`

Fields:

- `name`: module name
- `type`: selected module type
- `blueprint`: selected blueprint
- `status`: `inactive`
- `capabilities`: empty list for the first slice
- `events`: empty published and consumed lists
- `permissions`: empty list
- `settings`: empty list
- `cmsNamespaces`: empty list

## Module Doctor Report

Fields:

- `title`: report title
- `moduleName`: requested module
- `checks`: ordered list of check results
- `hasBlockingFailure`: true when any required check fails

## Module Doctor Check

Fields:

- `name`: check name
- `status`: `pass` or `fail`
- `summary`: short developer-facing summary
- `suggestion`: suggested fix
