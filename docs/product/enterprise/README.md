---
title: Enterprise Governance
description: Public enterprise governance entry point for Tempot bot template users
tags:
  - enterprise
  - governance
  - template
audience:
  - bot-developer
  - operator
  - super-admin
contentType: developer-docs
difficulty: beginner
---

# Enterprise Governance

This section explains how to use Tempot as an enterprise-grade Telegram bot
template without relying on Tempot's private development artifacts.

Tempot's public repository is intentionally smaller than the local development
workspace. It includes the files needed to create, configure, validate, and
operate a bot from the template. It excludes internal AI-agent state,
historical analysis folders, SpecKit internals, local stores, generated files,
and private development workflows.

## Start Here

| Document | Purpose |
| --- | --- |
| [Public Template Scope](./public-template-scope.md) | What is included in the public template and what is intentionally excluded. |
| [Bot Creation Checklist](./bot-creation-checklist.md) | Required steps before creating and running a new bot from Tempot. |
| [Pre-Launch Checklist](./pre-launch-checklist.md) | Evidence required before experimental launch and before production certification. |
| [RAG Governance](./rag-governance.md) | Retrieval rules, source priority, and indexing exclusions for public bot-owner knowledge. |

## Baseline Commands

Run these commands after cloning or generating a bot from the template:

```bash
pnpm install
pnpm check
pnpm docs:check
pnpm template:audit
```

`pnpm check` runs the public template audit, lint, and bot runtime build. It is
the minimum local confidence gate before using a bot created from this template.

## Enterprise Principle

Do not treat a successful local run as production approval. For real operation,
record evidence for configuration, security, health checks, backup readiness,
SLOs, rollback or forward-fix options, and upgrade compatibility.
