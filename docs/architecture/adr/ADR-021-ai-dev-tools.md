# ADR-021: Claude Code and Gemini CLI as Supported AI Development Tools

**Date:** 2026-03-19
**Status:** Accepted

## Context

Tempot's development workflow requires an AI development tool with the superpowers extension. Both Claude Code (Anthropic) and Gemini CLI (Google) support superpowers and provide equivalent capabilities for the 11-step workflow.

## Decision

Support **both Claude Code and Gemini CLI** as first-class development environments. Both are documented in `GEMINI.md` and `README.md`. The superpowers extension is mandatory on whichever tool is used.

## Consequences

- Developers can use either tool based on preference or subscription
- `GEMINI.md` provides context for Gemini CLI; `CLAUDE.md` (when added) for Claude Code
- The 11-step SpecKit + superpowers workflow is identical on both tools
- GitHub Actions use `claude-code-action` and `claude-code-security-review` for automated PR review
- No vendor lock-in to a single AI development tool

## Alternatives Rejected

**Claude Code only:** Requires Anthropic Pro/Max subscription. Excludes developers who prefer Gemini.

**Gemini CLI only:** Less suited for some documentation tasks. Excludes developers who prefer Claude.

**No AI tooling requirement:** Removes the structured workflow enforcement that superpowers provides, increasing inconsistency in AI-assisted development.
