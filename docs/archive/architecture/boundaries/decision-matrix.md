# Tempot Boundary Decision Matrix

**Status**: Draft execution artifact for spec #026
**Purpose**: Decide where new work belongs before files are created.

## Placement Matrix

| New work | Put it in | Do not put it in | Required proof |
| --- | --- | --- | --- |
| Telegram command, callback, menu, conversation, or user-facing flow | `modules/{module}` for business behavior, `apps/bot-server` for composition only | Service packages | Module spec, locales, tests |
| Reusable infrastructure service | `packages/{service}` | `apps/` or `modules/` | Package checklist, ADR if architectural |
| Business domain rule | `modules/{module}` | `apps/bot-server` | Module tests and event contracts |
| Cross-module notification | Event bus contract | Direct import from another module | Event name and payload contract |
| Database repository | Owning package/module repository | Service methods with direct Prisma calls | Repository tests |
| Shared primitive used by many packages | `packages/shared` only if truly generic | Random package or `utils.ts` | Clear owner and no domain coupling |
| AI provider abstraction | `packages/ai-core` | Business module or app startup | Provider contract and degradation mode |
| Storage provider | `packages/storage-engine` | Module-specific file logic | Storage contract and config |
| Dynamic form field | `packages/input-engine` if generic, module if domain-specific | `apps/bot-server` | Field contract and tests |
| Dashboard UI | Future `apps/dashboard` | Bot modules or packages | App route and module API boundary |
| SaaS tenant/account/billing | Future Tempot Cloud layer | Tempot Core packages unless scope-ready only | ADR and SaaS readiness review |
| Managed bot provisioning | Future managed-bot adapter/service | Existing bot-server startup or unrelated modules | ADR-041 and security model |
| Agent operating instruction | `.agents/skills` | `docs/` only | Skill validation |
| Human methodology guide | `docs/archive/developer` | `.agents/skills` only | Roadmap or workflow link |

## Questions Before Creating Files

1. Is the behavior reusable outside one module?
2. Does it depend on Telegram UI or a domain workflow?
3. Does it need database access?
4. Does it introduce an architectural decision?
5. Does it need user-facing text?
6. Can it be disabled without breaking the rest of Tempot?
7. Will a future SaaS tenant or bot scope need to own this behavior?

## Default Choices

- If the feature is business-specific, start in `modules/`.
- If the feature is infrastructure and reusable, start in `packages/`.
- If the feature only wires runtime dependencies, start in `apps/`.
- If the feature changes methodology or governance, start in `specs/` and `docs/archive/`.
- If the feature only helps agents work correctly, start in `.agents/skills` and add a human guide in `docs/archive/developer`.

## Escalation Rules

Create or update an ADR before implementation when the choice:

- Adds a new external dependency.
- Changes dependency direction.
- Creates a new runtime layer.
- Changes how modules communicate.
- Changes security, tenancy, audit, or token ownership.
- Changes the project methodology.
