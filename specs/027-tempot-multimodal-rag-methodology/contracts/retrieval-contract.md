# Contract: Hybrid Retrieval And Grounded Answer

**Feature**: 027-tempot-multimodal-rag-methodology
**Date**: 2026-04-29

This contract defines the expected behavior for retrieval planning and grounded answer generation.

## Retrieval Inputs

A retrieval request MUST include:

- query text or query content reference
- user id
- role or ability snapshot
- locale
- allowed content types
- bot and tenant scope when available
- maximum result count
- confidence threshold

## Retrieval Plan

The system MUST be able to represent these retrieval modes:

- semantic vector retrieval
- lexical retrieval
- relationship expansion
- content type filtering
- access filtering
- reranking

The first implementation may use a subset, but the plan model must not block the full hybrid path.

## Access Rules

- Access filtering occurs before generation context is assembled.
- Relationship traversal must not include inaccessible blocks.
- Unauthorized content is invisible to the generation model.

## Grounded Answer Rules

An answer in `answered` state MUST include:

- at least one citation
- cited block ids
- confidence value
- provider and model metadata
- i18n message key or structured answer payload

If no context is sufficient, the answer MUST be `no-context`.

If the provider refuses or degrades, the answer MUST be `refused` or `degraded` and must not be counted as grounded.

## Failure Rules

- Retrieval failures return `Result.err(AppError)`.
- Generation failures return `Result.err(AppError)`.
- Partial retrieval may return degraded context only when explicitly allowed by policy.
- No public API should throw after runtime startup.
