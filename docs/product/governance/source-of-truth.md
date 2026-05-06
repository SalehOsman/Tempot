---
title: Source Of Truth
description: Governance hierarchy and active project authority map for Tempot
tags:
  - governance
  - methodology
  - source-of-truth
audience:
  - package-developer
  - bot-developer
  - operator
contentType: developer-docs
difficulty: intermediate
---

## Governance Hierarchy

Tempot uses a strict authority hierarchy. Published docs help navigation, but
they do not replace the source documents.

| Priority | Source                            | Role                                            |
| -------- | --------------------------------- | ----------------------------------------------- |
| 1        | `.specify/memory/constitution.md` | Highest engineering authority                   |
| 2        | `.specify/memory/roles.md`        | AI and human role framework                     |
| 3        | `specs/`                          | Feature requirements and implementation handoff |
| 4        | `docs/archive/ROADMAP.md`         | Current project status and next work            |
| 5        | `docs/archive/architecture/adr/`  | Accepted architecture decisions                 |
| 6        | Source code                       | Implemented behavior                            |
| 7        | `.understand-anything/`           | Generated AI context snapshot                   |

## Delivery Methodology

SpecKit defines what and why. Superpowers defines how execution and verification
are performed. Tempot does not use `/speckit.implement` for production
execution.

The active workflow guide remains:

```text
docs/archive/developer/workflow-guide.md
```

## Documentation Sync

Documentation work must preserve code-documentation parity. Broad documentation
changes should update the Roadmap, repository maps, Starlight entry points, and
the active SpecKit feature.
