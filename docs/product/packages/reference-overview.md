---
title: Package Reference Overview
description: Entry point for Tempot package documentation and generated TypeDoc reference
tags:
  - packages
  - reference
  - typedoc
audience:
  - package-developer
  - bot-developer
contentType: developer-docs
difficulty: intermediate
---

## Package Documentation

Tempot packages live under `packages/` and provide reusable infrastructure for
applications and modules. Public package APIs are documented through generated
TypeDoc reference pages.

## Generated Reference

The API Reference sidebar is generated from package public exports by
starlight-typedoc. Do not edit generated reference pages manually.

The first restructure slice keeps the current TypeDoc package set stable. Newly
completed packages must be reviewed before being added to generated reference
coverage.

## Package Methodology

Use the package checklist before creating or changing packages:

```text
docs/archive/developer/package-creation-checklist.md
```

Package work must follow SpecKit artifacts, Superpowers execution, TypeScript
strict mode, Result-based errors, package boundaries, and relevant quality
gates.
