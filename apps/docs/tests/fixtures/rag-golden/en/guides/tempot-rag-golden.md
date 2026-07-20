---
title: Tempot RAG Golden Fixture
description: Controlled documentation fixture for validating RAG ingestion behavior.
tags:
  - rag
  - golden-fixture
audience:
  - operator
contentType: developer-docs
difficulty: intermediate
---

## System Identity

The controlled system identifier is `TEMPOT_RAG_GOLDEN_ALPHA`.
This identifier exists only in the golden RAG fixture and must remain stable.

## Deployment Contract

The controlled deployment command is `/golden-smoke`.
The controlled readiness route is `/golden-ready`.
The controlled deployment region is `test-region-omega`.

## Operator Smoke Question

When an operator asks for the golden smoke result, the expected answer is:
`golden smoke is healthy`.
