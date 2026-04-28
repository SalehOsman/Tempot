# Tempot Template Usability Roadmap

**Status**: Draft execution artifact for spec #026
**Purpose**: Make Tempot easier to adopt without weakening architecture discipline.

## Goals

- A new developer can validate the local environment quickly.
- A new module can be generated with the required structure.
- The first real module can be built in about 15 minutes.
- Templates remain governed by SpecKit, Superpowers, tests, i18n, and boundaries.

## Usability Tracks

| Track | Target | Notes |
| --- | --- | --- |
| Official CLI | `pnpm tempot init` now, `create-tempot-bot` later | Internal entrypoint implemented first; public package remains future work |
| Module generator | `pnpm tempot module create <name>` | Must generate tests, locales, events, contracts, exports |
| Developer doctor | `pnpm tempot doctor` | Validate Node, pnpm, Docker, env, DB, Redis, Prisma, webhook readiness |
| Quick path | `docs/archive/developer/quick-path-first-module.md` | 15-minute guided module build |
| Example modules | `modules/examples/*` or docs examples | Must not pollute active module registry |
| Agent skills guide | `docs/archive/developer/agent-skills-guide.md` | Human guide for `.agents/skills` |
| Documentation cleanup | `docs/archive/developer/documentation-cleanup-plan.md` | Remove drift and duplicate methodology docs |

## CLI Options

| Option | Benefit | Risk | Recommendation |
| --- | --- | --- | --- |
| `create-tempot-bot` | Familiar starter experience for new projects | Requires packaging and release workflow | Good public-facing option later |
| `pnpm tempot init` | Works inside monorepo and local development | Less discoverable outside repo | Best initial internal option |

Start with `pnpm tempot init` for local DX, then wrap it with `create-tempot-bot` when publishing the template externally.

Implemented initial mode:

- `pnpm tempot init` creates `.env` from `.env.example` when `.env` is missing.
- Existing `.env` files are preserved.
- Output lists the next local commands without printing secret values.

## Adoption Milestones

1. Document module boundary rules.
2. Add module checklist.
3. Add module generator plan.
4. Add developer doctor plan.
5. Add quick path guide.
6. Implement CLI in staged code features with tests. Initial modes now cover `init`, `doctor --quick`, and `module create`.
7. Add marketplace and dashboard plans after boundary enforcement is stable.

## Quality Rules

- Generated code must be TypeScript strict.
- Generated modules must include Arabic and English locale files.
- Generated modules must include tests from the first commit.
- Generated modules must use public package exports.
- Generated modules must not bypass module-registry.
- Generated docs must reference active SpecKit artifacts.
