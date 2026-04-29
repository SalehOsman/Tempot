# Contract: Content Block Pipeline

**Feature**: 027-tempot-multimodal-rag-methodology  
**Date**: 2026-04-29

This contract defines the public shape future packages use to hand normalized knowledge to RAG. It is a methodology contract, not a final TypeScript declaration.

## Ownership

| Responsibility                                     | Owner                            |
| -------------------------------------------------- | -------------------------------- |
| File storage and binary references                 | `storage-engine`                 |
| Document parsing                                   | `document-engine` when activated |
| Import adapters                                    | `import-engine` when activated   |
| Content block ingestion and indexing orchestration | `ai-core`                        |
| Physical vector and metadata storage               | `database`                       |

## ContentSource Contract

A source registration MUST include:

- stable source id
- source kind
- origin package or module
- access policy
- checksum when source is file-based
- locale when known
- future `botId` and `tenantId` scope when available

## ContentBlock Contract

A content block MUST include:

- stable block id
- source id
- block type
- source sequence
- text representation when available
- binary reference when needed
- metadata object
- extraction confidence
- access policy
- PII state
- embedding state

## Direct Content Insertion

Packages MAY provide pre-parsed content blocks directly. This supports importers and external processors without requiring Tempot to parse every source internally.

Rules:

- Direct content insertion still runs access validation.
- Direct content insertion still runs PII validation.
- Direct content insertion still records source and origin package.
- Direct content insertion must not bypass audit.

## Validation

- A block with `piiState = raw` cannot be embedded unless explicitly allowed by policy.
- A block cannot be indexed if its source access policy is missing.
- A block cannot be cited if the current user cannot access it.
- Low extraction confidence must lower answer confidence unless corroborated by other blocks.
