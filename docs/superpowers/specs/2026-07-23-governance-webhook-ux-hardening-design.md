# Governance Webhook UX Hardening Design

## Context

This design implements the Project Manager request to turn recent review
findings into enforceable project controls. It is not a new product module. It
extends three existing governed areas:

- Spec #057 `production-delivery-hardening`: HTTP body limits, webhook rate
  limiting, and staging smoke evidence.
- Spec #059 `methodology-lint-coverage`: automated governance checks.
- Spec #064 `admin-user-access-console`: Telegram menu UX constraints for
  readable single-button rows and non-clipped labels.

The existing ESLint size gates are already active. `eslint.config.js` enforces
`max-lines=200`, `max-lines-per-function=50`, and `max-params=3`, and the
pre-commit hook runs staged TypeScript files through ESLint. This sprint does
not reimplement those gates; it documents that they already exist and adds the
missing controls that are not covered by ESLint.

## Goals

1. Prevent trusted-proxy webhook rate limiting from falling back to a shared
   `unknown-client` bucket when a configured proxy header is missing.
2. Keep webhook body-size rejection deterministic and covered by focused tests,
   including requests without `content-length`.
3. Add a Telegram keyboard UX audit that fails when inline keyboards violate the
   project button standards.
4. Add a repeatable staging webhook smoke command that can generate evidence
   under `docs/operations/evidence/`.
5. Update documentation so future reviews do not report already-enforced ESLint
   size gates as missing.

## Non-Goals

- No new constitutional rule.
- No new dependency unless a focused implementation proves the current native
  approach cannot meet the requirement.
- No dashboard, visual editor, or runtime UI redesign.
- No real Telegram account automation. Real user journeys remain manual because
  they require external Telegram accounts and approvals.

## Architecture

### HTTP Perimeter

`apps/bot-server/src/server/hono.factory.ts` remains the single Hono perimeter
composition point. The rate limiter will keep local direct mode behavior when no
trusted proxy header is configured. When `TEMPOT_HTTP_TRUSTED_CLIENT_IP_HEADER`
is configured, missing trusted headers become a controlled bad-gateway response
before any rate-limit bucket is mutated.

The body-limit middleware stays in the same file for now. It already rejects
oversized payloads and is configurable through
`TEMPOT_HTTP_BODY_LIMIT_BYTES`. The implementation will avoid accidental bot
processing for payloads above the configured limit, including requests whose
size is known only after cloning the request body.

### Governance Audits

A new audit will live under `scripts/ci/` and follow the Spec #059 audit style:
read-only, deterministic, no new dependencies, explicit violations, and unit
tests under `scripts/ci/tests/unit/`.

The audit inspects Telegram inline keyboard construction in module menu
factories. It targets static `InlineKeyboard` usages and checks:

- no more than three `.text()` buttons between `.row()` separators;
- i18n button keys are traceable to `locales/ar.json` and `locales/en.json`;
- Arabic labels are no longer than 20 visible characters;
- English labels are no longer than 24 visible characters.

The audit is a governance guard, not a full Telegram renderer. Dynamic labels
that include runtime user names are allowed when their i18n template key itself
stays short and the code places each dynamic button on its own row.

### Staging Smoke

A new operation script will perform a repeatable webhook smoke against a target
base URL:

- `GET /live` expects `200`.
- `GET /ready` with `TEMPOT_READINESS_TOKEN` expects `200`.
- signed `POST /webhook` sends a minimal Telegram update using
  `WEBHOOK_SECRET_TOKEN`.
- the script writes a Markdown evidence file with command inputs, timestamps,
  statuses, and a clear production go/no-go note.

The command is designed for local Docker Desktop, Cloudflare tunnels, and real
staging domains. It does not register Telegram webhooks and does not replace
manual two-account Telegram journey evidence.

## Error Handling

- Missing trusted proxy headers return `502` with a stable machine-readable
  error category.
- Oversized webhook payloads return `413` with a stable category.
- Smoke script failures return exit code `1` and still write evidence when the
  output path is supplied.
- Audit violations return exit code `1`; audit internal errors return exit code
  `2` through the existing audit runner conventions if integrated later.

## Testing

- Red tests first for the trusted proxy missing-header behavior.
- Red tests first for body-limit behavior without `content-length`.
- Red tests first for Telegram keyboard audit fixture violations and passing
  production-like fixtures.
- Red tests first for staging smoke evidence generation using a local test
  server, not a real Telegram or Cloudflare dependency.

## Documentation Sync

Affected documentation:

- `docs/developer/methodology-lint.md`: document the Telegram keyboard audit.
- `docs/developer/workflow-guide.md`: document existing ESLint size gates and
  new UX governance gate.
- `docs/operations/deployment.md`: document trusted proxy failure behavior and
  body-limit configuration.
- `docs/operations/release-evidence-template.md`: reference the staging smoke
  command.
- Relevant SpecKit task files for #057, #059, and #064.

## Approval

The Project Manager requested immediate execution of the proposed controls on
2026-07-23 after reviewing the analysis.
