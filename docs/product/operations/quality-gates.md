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

## Graph Quality Gate

After changes to `.understand-anything/` or `docs/ONBOARDING.md`, verify graph
quality meets the documented thresholds:

| Metric | Minimum |
| ------ | ------- |
| Node count | >= 500 |
| Edge count | >= 800 |
| Source commit recorded | Required |

See the AI Context section for the full quality policy.

## Source Documents

The active gate map is maintained in:

```text
docs/development/documentation-quality-checks.md
docs/developer/workflow-guide.md
docs/ROADMAP.md
```
