# @tempot/docs

> Engineering documentation site powered by Astro + Starlight

## Purpose

Developer documentation for all Tempot packages:

- API reference via TypeDoc
- Architecture Decision Records (ADRs)
- Developer guides and workflows
- Package documentation and usage examples

## Phase

Phase 2 — Documentation System (spec #021)

## Dependencies

| Package                | Purpose                           |
| ---------------------- | --------------------------------- |
| Astro                  | Static site generator             |
| Starlight              | Documentation theme              |
| starlight-typedoc      | TypeDoc integration               |
| @tempot/shared         | Result pattern, AppError          |

## Scripts

```bash
pnpm --filter @tempot/docs dev        # Start dev server
pnpm --filter @tempot/docs build      # Build for production
pnpm --filter @tempot/docs preview    # Preview production build
```

## Status

✅ **Implemented** — Phase 2
