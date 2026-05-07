---
title: Architecture Knowledge Graph
description: Understand Anything graph adoption and architecture relationship map for Tempot
tags:
  - architecture
  - graph
  - ai-context
audience:
  - package-developer
  - bot-developer
  - operator
contentType: developer-docs
difficulty: intermediate
---

## Purpose

Tempot adopts the Understand Anything graph as an official AI onboarding and
project-context aid. It helps developers and AI tools understand repository
structure, package relationships, module structure, documentation entry points,
and event-like relationship points.

## Current Snapshot

The current graph summary is maintained at:

```text
docs/developer/project-knowledge-graph.md
```

The machine-readable graph is stored at:

```text
.understand-anything/knowledge-graph.json
```

## Authority Boundary

The graph is not a governance source of truth. If the graph conflicts with the
constitution, role framework, SpecKit artifacts, Roadmap, ADRs, or source code,
the higher authority wins and the graph must be regenerated or corrected.

## Refresh Policy

Regenerate the graph after broad package, module, SpecKit, architecture, or
documentation structure changes. A graph with no meaningful relationships is
not acceptable for professional project documentation.
