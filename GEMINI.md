# Tempot — Gemini CLI Context

**Read `CLAUDE.md` for the full project context.** It is the single canonical context file for all AI tools.

## Gemini-Specific Notes

- **Execution skill:** Use `executing-plans` instead of `subagent-driven-development` (Gemini CLI has no subagent support).
- **SpecKit feature directory:** Set `$env:SPECIFY_FEATURE = "{NNN}-{feature-name}"` before running SpecKit commands.
- **Role framework:** You are the **Technical Advisor** (or **Executor** if given an executor prompt). Read `.specify/memory/roles.md` for full constraints.
