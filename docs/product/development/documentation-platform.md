---
title: Documentation Platform
description: Professional documentation structure, Starlight usage, and validation gates
tags:
  - development
  - documentation
  - starlight
audience:
  - package-developer
  - bot-developer
  - operator
contentType: developer-docs
difficulty: intermediate
---

## Platform

Tempot uses Astro, Starlight, starlight-typedoc, and TypeDoc for the published
documentation site.

The accepted architecture decision is:

```text
docs/archive/architecture/adr/ADR-038-starlight-over-docusaurus.md
```

## Structure

Use Starlight pages for human navigation and repository-native files for source
of truth. Do not manually edit generated TypeDoc reference pages.

The restructure plan is maintained at:

```text
docs/archive/developer/documentation-restructure-plan.md
```

## Validation

Run these checks after broad documentation changes:

```bash
pnpm lint
pnpm spec:validate
pnpm --filter docs docs:validate
pnpm --filter docs build
```

Also run graph quality validation after changes to `.understand-anything/` or AI
onboarding documents.
