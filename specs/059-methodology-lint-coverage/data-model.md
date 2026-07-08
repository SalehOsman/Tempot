# Data Model: Methodology Lint Coverage

**Feature**: 059-methodology-lint-coverage
**Date**: 2026-06-23

This spec adds tooling only; there is no runtime data model, no database table, no event schema. The "data model" here describes the deterministic contracts each audit must honor so they compose predictably under the aggregator.

## Audit Result Contract

Each new audit (`language-policy-audit.ts`, `stale-artifacts-audit.ts`, `eslint-disable-audit.ts`) is a CLI program that conforms to:

```ts
type AuditResult = {
  audit: string;          // stable identifier, e.g., 'language-policy'
  passed: boolean;
  violations: Violation[];
  durationMs: number;
};

type Violation = {
  rule: string;           // e.g., 'Rule XL'
  file: string;           // path relative to repo root, POSIX separators
  line?: number;          // 1-indexed when applicable
  column?: number;        // 1-indexed when applicable
  excerpt?: string;       // up to 120 characters, no leading/trailing whitespace
  message: string;        // human-readable, single line
};
```

- The audit MUST print one human-readable line per violation in the format:
  `[<audit>] <rule>  <file>:<line>:<col>  <message>` followed by `    ↳ <excerpt>` on the next line if `excerpt` is present.
- On pass, the audit prints exactly one line: `[<audit>] PASS  (<durationMs> ms)`.
- On fail, after the per-violation lines, the audit prints exactly one line: `[<audit>] FAIL  (<n> violation(s) in <durationMs> ms)`.
- Exit code: `0` on pass, `1` on fail, `2` on internal error (e.g., unreadable file). The aggregator distinguishes `1` (legitimate failure) from `2` (audit broken).

## Aggregator Result Contract

```ts
type AggregateResult = {
  audits: AuditResult[];
  totalDurationMs: number;
  failedAuditMask: number; // bit set per failing audit
};
```

- Each audit gets a stable bit index (defined in the aggregator source as a constant table).
- Final exit code: bitwise OR of `1 << index` for each failed audit, capped to a positive 32-bit integer. On internal error (exit 2 from any audit), final exit is `2` regardless of other audits' results (fail-fast for tooling integrity).

## Allowlist File Format

`scripts/ci/methodology-lint.allowlist.json` (required even if all categories have empty entries arrays):

```json
{
  "$schema": "./methodology-lint.allowlist.schema.json",
  "languagePolicy": {
    "entries": [
      {
        "pattern": "docs/analysis-2026-06-10/**",
        "reason": "Pre-existing Arabic Technical Advisor analysis predating Spec #059.",
        "added_at": "2026-06-23",
        "expires_at": "2026-09-21",
        "owner_spec": "061-arabic-docs-translation-or-removal"
      },
      {
        "pattern": "docs/analysis-2026-06-23/**",
        "reason": "Analysis that triggered Spec #059; PM-granted waiver recorded in docs/analysis-2026-06-23/README.md. Scheduled for translation or removal under Spec #061.",
        "added_at": "2026-06-23",
        "expires_at": "2026-09-21",
        "owner_spec": "061-arabic-docs-translation-or-removal"
      },
      {
        "pattern": "docs/project-analysis/2026-06-07/**",
        "reason": "Original 2026-06-07 audit deliverable preceding the language enforcement spec.",
        "added_at": "2026-06-23",
        "expires_at": "2026-09-21",
        "owner_spec": "061-arabic-docs-translation-or-removal"
      },
      {
        "pattern": "modules/user-management/abilities.ts",
        "reason": "Arabic JSDoc comments on lines 1-10 pending Spec #060 cleanup.",
        "added_at": "2026-06-23",
        "expires_at": "2026-09-21",
        "owner_spec": "060-workspace-cleanup"
      },
      {
        "pattern": "packages/input-engine/src/fields/numbers/arabic-numerals.helper.ts",
        "reason": "Arabic header comments pending Spec #060 cleanup.",
        "added_at": "2026-06-23",
        "expires_at": "2026-09-21",
        "owner_spec": "060-workspace-cleanup"
      }
    ]
  },
  "staleArtifacts": {
    "entries": [
      {
        "pattern": "apps/bot-server/src/bot-server.types.js",
        "reason": "Stale .js artifact from previous emit; removal queued under Spec #060.",
        "added_at": "2026-06-23",
        "expires_at": "2026-09-21",
        "owner_spec": "060-workspace-cleanup"
      },
      {
        "pattern": "modules/user-management/utils/",
        "reason": "Empty utils/ scaffolding directory; removal queued under Spec #060.",
        "added_at": "2026-06-23",
        "expires_at": "2026-09-21",
        "owner_spec": "060-workspace-cleanup"
      }
    ]
  },
  "eslintDisable": {
    "entries": [
      {
        "pattern": "apps/bot-server/scripts/webhook-manager.ts",
        "reason": "Two eslint-disable directives (no-console, max-lines-per-function) pending refactor under Spec #060.",
        "added_at": "2026-06-23",
        "expires_at": "2026-09-21",
        "owner_spec": "060-workspace-cleanup"
      }
    ]
  }
}
```

### Allowlist Entry Schema

Each entry across all categories conforms to:

```ts
type AllowlistEntry = {
  pattern: string;        // glob (POSIX separators)
  reason: string;         // ≥ 20 characters
  added_at: string;       // ISO 8601 date YYYY-MM-DD
  expires_at: string;     // ISO 8601 date YYYY-MM-DD; MUST be ≤ added_at + 90 days
  owner_spec: string;     // spec slug, e.g., '060-workspace-cleanup'
};
```

### Allowlist Meta-Linter Rules (enforced at audit startup)

| Rule                                                              | Failure exit code | Message prefix      |
| ----------------------------------------------------------------- | :---------------: | ------------------- |
| Missing required field on any entry.                              | 2                 | `[allowlist-meta]`  |
| `reason` shorter than 20 characters.                              | 2                 | `[allowlist-meta]`  |
| `expires_at` not parseable as ISO 8601 date.                      | 2                 | `[allowlist-meta]`  |
| `expires_at` > `added_at` + 90 days.                              | 2                 | `[allowlist-meta]`  |
| `pattern` does not match any real file at startup.                | 2                 | `[allowlist-meta]`  |
| `owner_spec` slug not present under `specs/`.                     | 2                 | `[allowlist-meta]`  |
| `expires_at` in the past (entry expired).                         | 1                 | `[allowlist-meta]`  |
| `expires_at` within 14 days of today.                             | 0 (warning only)  | `[allowlist-meta]`  |

Meta-linter results are printed at the top of every aggregator run before any audit executes.

## File Discovery Roots

| Audit                 | Roots                                                                                                                                                                | Excluded                                                            |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| language-policy       | `docs/**/*.md`, `apps/**/*.ts`, `packages/**/*.ts`, `modules/**/*.ts`, `scripts/**/*.ts`, `.specify/**/*.md`, repo root `*.md`                                          | `**/node_modules/**`, `**/dist/**`, `**/locales/**`, `**/tests/**` for string literals, `**/coverage/**` |
| stale-artifacts       | `apps/*/src/**/*.js`, `packages/*/src/**/*.js`, `modules/*/**/*.js`; directory check: `modules/*/utils/`                                                              | `**/node_modules/**`, `**/dist/**`, `**/coverage/**`, `*.config.js` |
| eslint-disable        | `apps/**/*.ts`, `packages/**/*.ts`, `modules/**/*.ts`, `scripts/**/*.ts`                                                                                              | `**/tests/**`, `**/node_modules/**`, `**/dist/**`, `*.d.ts`, `**/coverage/**` |

## TS Tokenizer (used by language-policy)

A 30–50 line state machine implemented in `scripts/ci/lib/ts-token-scanner.ts`:

```ts
type Span = {
  kind: 'code' | 'string' | 'template' | 'lineComment' | 'blockComment';
  start: number; // byte offset
  end: number;
};

function scan(source: string): Span[];
```

- Tracks: single quotes, double quotes, backticks (with `${ ... }` interpolation), `//` line comments, `/* */` block comments.
- Does NOT parse expressions inside `${ ... }` beyond depth tracking.
- Used by `language-policy-audit.ts` to know whether a matched Arabic code point lies in a comment (violation per Q4 Option B) or a string literal (exempt for tests; violation elsewhere).
- Unit-tested independently.

## Exit Code Catalogue

| Code | Meaning                                                                                              |
| ---: | ---------------------------------------------------------------------------------------------------- |
|    0 | All audits passed. May still print warnings (e.g., allowlist entry near expiration).                 |
|    1 | At least one audit reported a legitimate violation. See bit pattern in stdout.                       |
|    2 | An audit failed to run (filesystem error, unreadable file, malformed allowlist, dangling pattern).   |

The aggregator distinguishes exit 1 (violations) from exit 2 (tooling failure) so CI can route to the right notification target.

## File Layout Added by this Spec

```
scripts/ci/
├── language-policy-audit.ts                       (new)
├── stale-artifacts-audit.ts                       (new)
├── eslint-disable-audit.ts                        (new)
├── methodology-lint.ts                            (new, aggregator)
├── methodology-lint.allowlist.json                (new, required)
├── methodology-lint.allowlist.schema.json         (new, JSON schema)
└── lib/
    ├── ts-token-scanner.ts                        (new, used by language-policy)
    ├── audit-result.ts                            (new, shared types & formatting)
    ├── audit-runner.ts                            (new, CLI wrapper)
    ├── allowlist-loader.ts                        (new, parse + meta-lint)
    └── report-formatter.ts                        (new, human / json / sarif)

scripts/ci/tests/
├── unit/
│   ├── language-policy-audit.test.ts              (new)
│   ├── stale-artifacts-audit.test.ts              (new)
│   ├── eslint-disable-audit.test.ts               (new)
│   ├── methodology-lint.test.ts                   (new, includes perf regression test)
│   ├── ts-token-scanner.test.ts                   (new)
│   ├── audit-result.test.ts                       (new)
│   ├── allowlist-loader.test.ts                   (new)
│   └── report-formatter.test.ts                   (new)
└── __fixtures__/
    ├── language-policy/
    │   ├── arabic-doc.md
    │   ├── english-doc.md
    │   ├── ts-with-arabic-comment.ts
    │   ├── ts-with-arabic-string-literal.ts
    │   └── sample-test/
    │       └── sanitizer.test.ts                       (Arabic string literal allowed)
    ├── stale-artifacts/
    │   ├── sample-app/src/stale.js
    │   ├── empty-utils-module/utils/                  (intentionally empty)
    │   └── populated-utils-module/utils/index.ts
    └── eslint-disable/
        ├── disabled.ts
        ├── disabled-next-line.ts
        └── tests/exempt.ts                            (test exemption)

docs/developer/
└── methodology-lint.md                            (new)
```

## File Layout Modified by this Spec

```
package.json                                  (add 'methodology:lint' script; add 'methodology:lint:quick' alias)
.github/workflows/ci.yml                      (replace per-audit steps with one aggregator step + artifact upload)
.husky/pre-commit                             (add 'pnpm methodology:lint --quick' invocation)
scripts/tempot/doctor.ts                      (invoke 'methodology:lint --quick --silent' in doctor health check)
docs/developer/workflow-guide.md              (link to methodology-lint.md and pre-push usage)
docs/ROADMAP.md                               (Spec #059 entry; reference allowlist debt counter)
.specify/memory/constitution.md               (Amendment 2.6.0: Enforcement note next to Rule XL)
.changeset/059-methodology-lint-coverage.md   (new)
```

## Output Formats

The aggregator (and each audit when invoked standalone) supports three formats via `--format=<human|json|sarif>`. Default is `human`.

### Human format (default)

For every violation:

```
[<audit>] <rule>  <file>:<line>:<col>
  ↳ <excerpt>
  Fix: <one-line suggestion>
  Reference: <constitution-path>:<line>
```

For every audit, a header line and a result line (PASS or FAIL).

For the aggregator, a final summary table:

```
=== Methodology Lint Summary ===
Audit                                 Result   Duration   Violations
language-policy                       PASS         234ms            0
stale-artifacts                       PASS          12ms            0
eslint-disable                        PASS          45ms            0
source-conformance                    PASS         110ms            0
...
--------------------------------
Overall                               PASS         ...           0
Allowlist entries: 8 total | 0 expiring soon | 0 expired
```

### JSON format (`--format=json`)

Machine-readable, stable schema:

```ts
type JsonReport = {
  version: '1';
  generated_at: string;            // ISO 8601
  overall: 'pass' | 'fail';
  total_duration_ms: number;
  audits: AuditResult[];
  allowlist: {
    total: number;
    expiring_soon: number;          // ≤ 14 days from now
    expired: number;
  };
};
```

### SARIF format (`--format=sarif`)

Standard SARIF 2.1.0 output for upload to GitHub code-scanning (`github/codeql-action/upload-sarif@v4`). Each violation becomes a `result` with `ruleId` equal to the constitution rule reference.

## Invariants

- No audit modifies any file. All audits are read-only on the filesystem.
- No audit shells out to anything other than itself; the aggregator shells out via `child_process.spawnSync` to invoke audits in isolation.
- No audit depends on a TTY; CI environment MUST produce identical output to local (deterministic).
- Violation ordering is sorted by `file:line:column` ascending; identical input always yields identical output bytes.
- No audit introduces new runtime/devDependencies; uses existing project dependencies only.
