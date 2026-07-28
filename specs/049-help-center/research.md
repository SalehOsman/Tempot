# Research: help-center

## Decision: keep help UX in the module

The help-center module remains responsible for Telegram-facing help text,
buttons, `/help`, `/ask`, and callback handling. This preserves module
ownership and keeps user-facing text in module locales.

## Decision: inject AI through bot-server

`@tempot/ai-core` is infrastructure. The help-center module receives an
optional `HelpAssistantProvider` and does not import AI infrastructure directly.
This preserves the clean architecture boundary and allows graceful degradation
when AI is disabled or not configured.

## Decision: activate retrieval-grounded RAG first

The first activation slice uses the existing RAG retrieval path to return a
grounded snippet and citations. This is safer than adding generative answer
synthesis immediately because it limits hallucination risk while proving
runtime composition, role-aware retrieval, localization, and no-context
handling.

## Future Research

- Add prompt-governed generative synthesis behind the existing provider
  contract.
- Add staging write-smoke evidence for documentation ingestion and Telegram
  `/ask` behavior.
- Add cost, latency, leakage, and citation coverage evidence before exposing
  broader AI assistant workflows.
