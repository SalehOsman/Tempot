# Quickstart: Authorization Correction Verification

## Purpose

Verify the implementation increment without requiring a live Telegram bot.

## RED Baseline

1. Build a USER and ADMIN through the production ability factory.
2. Send a representative allowed command and callback through the current
   middleware chain.
3. Confirm the tests fail because the global middleware requires `manage all`.
4. Attempt an ADMIN-only mutation as USER and assert no mutation.

## GREEN Verification

1. Repeat the role matrix after the global middleware correction.
2. Confirm allowed USER and ADMIN flows reach their handlers.
3. Confirm insufficient, disabled, and missing actors are denied.
4. Confirm SUPER_ADMIN retains `manage all`.
5. Confirm every denial precedes repository mutation.

## Regression Commands

```powershell
pnpm --filter bot-server test
pnpm test:unit
pnpm test:integration
pnpm lint
pnpm build
pnpm boundary:audit
pnpm cms:check
pnpm spec:validate
```

## Review Evidence

- Authorization coverage matrix.
- RED and GREEN test output.
- Production ability factory role cases.
- Denial audit/log examples with no PII.
- Code-review report with zero Critical/High authorization findings.
