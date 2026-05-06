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
| `docs/archive/developer/project-knowledge-graph.md`      | Graph summary                       |
| `docs/archive/developer/understand-anything-workflow.md` | Operating workflow                  |

## Limits

The graph does not replace the constitution, role framework, SpecKit artifacts,
Roadmap, ADRs, or source code. It is a map, not the authority.

## Refresh

Refresh the graph after broad architecture, package, module, SpecKit, or
documentation structure changes. Reject graph output that has no meaningful
relationships.
