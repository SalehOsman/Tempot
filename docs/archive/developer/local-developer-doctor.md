# Local Developer Doctor

**Status**: Draft execution artifact for spec #026
**Purpose**: Define a local diagnostic command for Tempot contributors.

## Command Shape

```powershell
pnpm tempot doctor
```

## Checks

| Check | Expected |
| --- | --- |
| Node.js | Meets repository required version |
| pnpm | Version 10+ |
| Docker | Installed and running when integration tests are needed |
| Git | Worktree/branch status visible |
| Environment files | Required `.env` keys present for selected mode |
| PostgreSQL | Connection reachable when DB tests are enabled |
| pgvector | Extension available when vector tests are enabled |
| Redis | Connection reachable when cache/session tests are enabled |
| Prisma | Client generation succeeds |
| Local webhook | Tunnel or local endpoint readiness when bot webhook is enabled |
| Telegram token | Present only in local env, never committed |
| CI parity | Local commands match GitHub Actions gates |

## Output Format

The doctor should print:

- Check name.
- Status: pass, warn, fail, skipped.
- Fix suggestion.
- Whether failure blocks local development.

## Modes

| Mode | Purpose |
| --- | --- |
| `--quick` | Node, pnpm, Git, install state |
| `--ci` | CI parity gates |
| `--integration` | Docker, PostgreSQL, Redis |
| `--webhook` | Local bot webhook readiness |

## Privacy Rules

- Never print secret values.
- Print only key names and redacted status.
- Do not write env files automatically without explicit confirmation.
