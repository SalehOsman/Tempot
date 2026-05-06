---
title: Quality Gates
description: Operational validation gates for documentation and repository changes
tags:
  - operations
  - quality-gates
  - validation
audience:
  - package-developer
  - bot-developer
  - operator
contentType: developer-docs
difficulty: intermediate
---

## Core Gates

Use the smallest relevant gate set while developing, then broaden validation
before merge.

```bash
pnpm lint
pnpm build
pnpm test:unit
pnpm test:integration
pnpm spec:validate
pnpm cms:check
pnpm boundary:audit
pnpm module:checklist
```

## Documentation Gates

For documentation platform changes, run:

```bash
pnpm --filter docs docs:validate
pnpm --filter docs build
```

Also run graph quality validation when `.understand-anything/` or
`docs/ONBOARDING.md` changes.

## Source Documents

The active gate map is maintained in:

```text
docs/development/documentation-quality-checks.md
docs/archive/developer/workflow-guide.md
docs/archive/ROADMAP.md
```
