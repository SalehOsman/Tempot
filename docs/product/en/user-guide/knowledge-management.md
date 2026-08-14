---
title: Knowledge Management
description: How super admins build knowledge indexes and how users ask AI-assisted questions
tags:
  - user-guide
  - knowledge
  - ai
  - rag
audience:
  - operator
  - super-admin
contentType: user-guide
difficulty: intermediate
---

## Overview

Knowledge management is the super-admin console for building the bot knowledge
index. The AI help flow uses that index to answer documentation questions with
citations.

## Knowledge Sources

The bot can build separate knowledge indexes for:

| Source       | Purpose                                               |
| ------------ | ----------------------------------------------------- |
| Product      | User-facing product and module documentation          |
| Operations   | runbooks, evidence, deployment, and recovery docs      |
| Architecture | architecture decisions and system design documents    |
| Analysis     | project analysis reports and review evidence          |
| Full Project | broad documentation, specs, packages, and modules      |
| Custom       | additional named paths configured by a super admin     |

For user-facing questions, Product should normally be built first. Operations
and Architecture are useful for administrator and engineering questions.

## Build the Knowledge Index

To build knowledge:

1. Open the main menu with `/start`.
2. Open Knowledge.
3. Choose Sources.
4. Select the source to build.
5. Run Dry run to verify the selected source can be scanned safely.
6. Run Write index to write embeddings for the selected source.
7. Wait for the completion message.

The current bot-side write flow runs a safety estimate before writing and blocks
sources that exceed the configured chunk limit. Full reindex is visible in the
menu, but the current user flow reports it as planned rather than executing it.

The build uses the configured embedding provider. Local Ollama embeddings can be
used for free local indexing when `AI_EMBEDDING_PROVIDER=ollama` and
`OLLAMA_BASE_URL` points to the local Ollama service.

## Ask Questions

Users can ask questions through the AI help button or by sending `/ask`, `ask/`,
`ask`, or Arabic ask aliases followed by the question. The Knowledge menu Test
query action currently points users to `/ask` for retrieval testing.

If the answer says no reliable context was found, rebuild the relevant source.
For product usage questions, rebuild Product. For operational recovery
questions, rebuild Operations.
