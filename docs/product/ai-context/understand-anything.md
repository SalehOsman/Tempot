---
title: Understand Anything
description: AI context graph workflow and authority boundary for Tempot
tags:
  - ai-context
  - knowledge-graph
  - onboarding
audience:
  - package-developer
  - bot-developer
  - operator
contentType: developer-docs
difficulty: intermediate
---

## Official Use

Understand Anything is an official AI onboarding and project-context aid for
Tempot. It is intended to help AI tools and developers understand the project
before deeper source review.

## Files

| File                                                     | Purpose                             |
| -------------------------------------------------------- | ----------------------------------- |
| `.understand-anything/knowledge-graph.json`              | Machine-readable relationship graph |
| `.understand-anything/meta.json`                         | Graph source commit metadata        |
| `docs/ONBOARDING.md`                                     | Human and AI onboarding guide       |
| `docs/developer/project-knowledge-graph.md`      | Graph summary                       |
| `docs/developer/understand-anything-workflow.md` | Operating workflow                  |

## Limits

The graph does not replace the constitution, role framework, SpecKit artifacts,
Roadmap, ADRs, or source code. It is a map, not the authority.

## Quality Thresholds

A regenerated graph must meet these minimum thresholds before it is committed:

| Metric | Minimum | Current |
| ------ | ------- | ------- |
| Node count | >= 500 | 1127 |
| Edge count | >= 800 | 1911 |
| Source commit recorded | Required | Yes |

If a regenerated graph falls below these thresholds, do not commit it. Instead,
investigate whether the generation scope was too narrow or the source files were
incomplete.

## Refresh Policy

Refresh the graph after:

- Broad architecture or package structure changes.
- New module or package additions.
- SpecKit feature completion that adds or removes significant components.
- Documentation structure changes that affect navigation or entry points.

Do not refresh the graph for minor documentation edits, typo fixes, or
single-file updates that do not change the project structure.

Reject graph output that has no meaningful relationships or that drops below the
quality thresholds above.
