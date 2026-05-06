---
title: Module Methodology
description: Entry point for Tempot module development methodology and tooling
tags:
  - modules
  - methodology
  - tooling
audience:
  - package-developer
  - bot-developer
contentType: developer-docs
difficulty: intermediate
---

## Module Development

Modules are business capabilities under `modules/`. They must stay isolated and
communicate through the Event Bus instead of direct module imports.

The active module methodology is documented at:

```text
docs/archive/developer/module-development-catalog.md
```

## Start With SpecKit

Every production module starts with a dedicated SpecKit feature. Implementation
begins only after the handoff gate passes.

## Tooling

Current module tooling includes:

```bash
pnpm tempot module create <module-name> --type <type> --blueprint basic
pnpm tempot module doctor <module-name>
```

The generator and doctor are governed by Spec #037:

```text
specs/037-module-tooling-foundation/
```
