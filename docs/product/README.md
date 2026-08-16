---
title: Product Documentation
description: Product-facing documentation entry point for Tempot.
tags:
  - overview
  - documentation
audience:
  - bot-developer
  - operator
contentType: developer-docs
---

# Tempot Product Documentation

This area is for product-facing and generated reference documentation.

## Contents

| Path                      | Purpose                                               |
| ------------------------- | ----------------------------------------------------- |
| `docs/product/ar/`        | Arabic product documentation content.                 |
| `docs/product/en/`        | English product documentation content.                |
| `docs/product/architecture/` | Public architecture maps and boundary records.     |
| `docs/product/enterprise/` | Public governance and launch checklists for bot creators. |
| `docs/product/operations/` | Public operating gates, SLOs, and change governance. |
| `docs/product/releases/`  | Public release evidence templates.                    |
| `docs/product/upgrades/`  | Public template upgrade and compatibility guidance.   |
| `docs/product/reference/` | Generated API reference from package TypeDoc output.  |

## Rules
- Do not edit generated reference pages manually.
- User-facing product documentation should exist in Arabic and English when it
  describes end-user behavior.
- Developer reference pages stay in English.
- Package READMEs are local package entry points; this directory is the
  generated cross-package reference.
