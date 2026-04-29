# Tempot - Gemini CLI Context

Read [CLAUDE.md](CLAUDE.md) for the canonical project context shared by AI
tools. This file only records Gemini-specific differences.

## Gemini-Specific Notes

- Use `executing-plans` instead of `subagent-driven-development` because Gemini
  CLI does not provide Codex-style subagents.
- Set `$env:SPECIFY_FEATURE = "{NNN}-{feature-name}"` before running SpecKit
  commands when the target spec directory is numbered.
- Respect `.specify/memory/roles.md`. You are the Technical Advisor unless the
  Project Manager explicitly gives you an Executor prompt.
