# Contract: RAG Evaluation

**Feature**: 027-tempot-multimodal-rag-methodology  
**Date**: 2026-04-29

RAG quality must be measurable before broad rollout.

## Evaluation Case

Each case MUST define:

- query
- user role
- locale
- allowed and forbidden sources
- expected content block ids
- expected answer constraints
- tags for modality and package ownership

## Required Metrics

The evaluator MUST report:

- retrieval hit rate
- citation coverage
- unauthorized source leakage count
- unsupported-answer rate
- no-context correctness
- p95 retrieval latency
- p95 answer latency
- token usage
- estimated cost

## Pass Criteria

An implementation slice is not complete unless:

- no unauthorized source appears in context
- grounded answers cite at least one expected source when available
- no-context cases do not hallucinate
- evaluation output is committed or reproducible by command

## Future CLI Shape

The future CLI MAY expose:

```bash
pnpm tempot ai eval
pnpm tempot ai index --source <source-id>
pnpm tempot ai doctor
```

The exact CLI contract must be finalized during implementation.
