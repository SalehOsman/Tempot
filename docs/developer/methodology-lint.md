# Methodology Lint

`methodology-lint` is the local and CI entry point for Tempot methodology
enforcement that is not already covered by ESLint, TypeScript, or unit tests.

## Commands

```bash
pnpm methodology:lint
pnpm --silent methodology:lint --format=json
pnpm methodology:lint --format=sarif
pnpm methodology:lint:quick
```

Use `pnpm methodology:lint` before pushing methodology, documentation, CI, or
repository hygiene changes. The quick command is intended for pre-commit and
`pnpm tempot doctor --quick`; it limits text-heavy checks to staged or changed
files.

## Audits

| Audit | Enforces | Behavior |
| ----- | -------- | -------- |
| `allowlist-meta` | Time-boxed debt accountability | Fails malformed, dangling, expired, or overlong allowlist entries. |
| `language-policy` | Rule XL | Blocks Arabic Unicode in developer-facing Markdown, comments, and non-test TypeScript strings outside the allowlist. Locale files and test data strings are exempt. |
| `stale-artifacts` | Rule LXXVIII | Blocks stale JavaScript artifacts under source trees and empty `modules/*/utils/` directories. |
| `eslint-disable` | Rule I | Blocks ESLint suppression comments outside tests, while ignoring regex/string references to the directive text. |

## Allowlist

Known pre-existing debt is tracked in
`scripts/ci/methodology-lint.allowlist.json`.

Each entry requires:

- `pattern`: exact path, directory path, or `/**` suffix pattern.
- `reason`: at least 20 characters.
- `added_at`: ISO date.
- `expires_at`: ISO date, no more than 90 days after `added_at`.
- `owner_spec`: existing spec directory that owns removal of the debt.

Entries expiring within 14 days are reported as warnings. Expired entries fail
the audit.

## CI report

The CI methodology job writes `methodology-lint-report.json` and uploads it as
the `methodology-lint-report` artifact. The JSON report includes audit results,
total duration, and allowlist counters.

## Adding a new audit

1. Add a focused audit under `scripts/ci/`.
2. Add RED/GREEN unit tests under `scripts/ci/tests/unit/`.
3. Return deterministic `Violation` objects sorted by `file:line:column`.
4. Add the audit to `scripts/ci/methodology-lint.ts`.
5. Document the audit in this file and update the roadmap if it changes project
   governance.
