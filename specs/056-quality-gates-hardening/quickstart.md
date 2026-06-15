# Quickstart: Quality Gates Hardening Verification

## Workspace Test Inventory

1. List all workspace projects.
2. Run the canonical root test command.
3. Compare executed project names with inventory.
4. Seed one temporary failing app test and confirm failure.

## Coverage

1. Run root coverage.
2. Confirm app source appears.
3. Seed a component below its blocking threshold.
4. Confirm failure even when aggregate coverage passes.
5. Confirm Vitest and coverage provider versions are identical.

## Documentation

1. Run `pnpm docs:freshness` from root.
2. Run frontmatter validation and docs tests.
3. Seed one stale active claim and confirm actionable failure.
4. Confirm archived content follows archive policy.

## Toolchain

1. Start from a clean checkout.
2. Activate Corepack.
3. Confirm the pinned pnpm policy.
4. Run required gates on Node 22.12+ and the current supported line.

## Commands

```powershell
pnpm test:unit
pnpm test:integration
pnpm test:e2e
pnpm test:coverage
pnpm test:inventory
pnpm --filter bot-server test
pnpm --filter docs test
pnpm docs:check
pnpm source:conformance
pnpm toolchain:audit
pnpm lint
pnpm build
pnpm boundary:audit
pnpm module:checklist
pnpm cms:check
pnpm spec:validate
```

The supported CI runtime matrix is Node.js 22.12.0 and Node.js 24. The package
manager baseline is pinned through Corepack to pnpm 10.33.3, which supports the
minimum runtime.
