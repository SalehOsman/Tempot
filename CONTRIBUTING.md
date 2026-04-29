# Contributing to Tempot

Tempot uses a strict specification-driven workflow. Contributions are welcome,
but every change must respect the constitution, the role framework, and the
quality gates.

## Required Reading

- [Project constitution](.specify/memory/constitution.md)
- [Role framework](.specify/memory/roles.md)
- [Workflow guide](docs/archive/developer/workflow-guide.md)
- [Roadmap](docs/archive/ROADMAP.md)
- [Documentation map](docs/README.md)

## Prerequisites

- Node.js 22.12 or newer.
- pnpm 10 or newer.
- Docker and Docker Compose.
- SpecKit CLI.
- Superpowers skills on the AI tool used for execution.

## Workflow

Every production change follows this sequence:

1. Create or update the relevant SpecKit artifacts.
2. Resolve clarification questions.
3. Generate or update the technical plan and tasks.
4. Run the SpecKit consistency check.
5. Execute through Superpowers with TDD.
6. Request code review against the spec and constitution.
7. Run verification gates.
8. Update affected documentation.
9. Merge only after all required gates pass.

Documentation-only changes still need scope control, review, and verification.
They do not require TDD unless production behavior changes.

## Branches

Do not work directly on `main`. Use an isolated branch or worktree.

Recommended branch names:

```text
codex/docs-restructure
codex/fix-ci-gate
codex/notifier-package
```

## Commit Messages

Use Conventional Commits:

```text
docs(readme): refresh project entry points
fix(ai-core): use translated confirmation response
feat(notifier): add notification dispatcher
security(ci): block high severity audit failures
```

## Code Standards

- TypeScript strict mode.
- No `any`, `@ts-ignore`, `@ts-expect-error`, or `eslint-disable`.
- No hardcoded user-facing text in `.ts` files.
- Public fallible APIs return `Result<T, AppError>`.
- Services do not access Prisma directly.
- Modules communicate through the event bus only.
- Unused code is deleted, not commented out.

## Verification

Use the relevant subset while working:

```bash
pnpm lint
pnpm build
pnpm test:unit
pnpm test:integration
pnpm spec:validate
pnpm cms:check
pnpm audit --audit-level=high
```

Before merge, include evidence for every gate that applies to the change.

## Security

Do not report vulnerabilities through public issues. Use GitHub Security
Advisories as described in [SECURITY.md](SECURITY.md).
