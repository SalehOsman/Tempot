---
title: RAG Governance
description: Public retrieval governance for Tempot documentation and bot knowledge sources.
tags:
  - enterprise
  - rag
  - documentation
audience:
  - bot-developer
  - operator
contentType: developer-docs
difficulty: intermediate
---

# RAG Governance

Tempot documentation is designed to support human readers and future AI/RAG
retrieval. Source code remains the authority for runtime behavior. RAG indexes
must avoid mixing public template guidance with private development history.

## Index Public Sources

Prefer these sources for public bot-owner answers:

- `README.md`
- `.env.example`
- `docs/product/`
- `docs/guides/`
- `docs/operations/`
- `docs/security/`
- `docs/troubleshooting/`
- package and module READMEs that are part of the public template

## Exclude Private Or Historical Sources

Do not index these sources for public bot-owner answers:

- `.agents/`
- `.claude/`
- `.gemini/`
- `.opencode/`
- `.specify/`
- `.understand-anything/`
- `.worktrees/`
- `docs/archive/`
- `docs/developer/`
- `docs/development/`
- `docs/project-analysis/`
- `specs/`
- local `.env` files
- logs, backups, database dumps, and generated runtime artifacts

## Retrieval Rules

RAG answers should:

- Prefer current public documentation over historical analysis.
- Cite the file path used as evidence.
- Avoid claiming behavior that is not documented or visible in source files.
- Treat `.env.example` as the public configuration source of truth.
- Treat `README.md` as the first-run entry point.
- Treat source code as higher authority than documentation when they disagree.

## Chunking Guidance

Documentation should stay chunk-friendly:

- Use short headings.
- Keep one decision or procedure per section.
- Prefer tables for checklists, compatibility, and release evidence.
- Keep historical context in analysis folders, not public guides.
- Link to specific public files instead of duplicating long procedures.

## Bot-Specific Knowledge

When a bot is created from Tempot, add bot-specific knowledge in that bot
repository rather than editing Tempot history. Recommended bot-specific sources:

- bot README
- module READMEs
- operator guide
- admin guide
- release evidence records
- support FAQ

Do not index production secrets, private user data, database dumps, or private
operator messages.
