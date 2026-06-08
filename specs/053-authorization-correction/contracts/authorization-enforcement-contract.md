# Contract: Authorization Enforcement

## Global Middleware Contract

Global middleware MUST:

1. Resolve Telegram identity when present.
2. Resolve or bootstrap the application actor according to existing policy.
3. Reject disabled actors from protected behavior.
4. Build the production ability.
5. Attach immutable actor and ability context.
6. Continue without requiring `manage all`.
7. Return a typed controlled failure when context construction fails.

Global middleware MUST NOT:

- Grant a broader ability than the production role permits.
- Decide every module operation as `manage all`.
- Make an unclassified protected entry point public.
- record protected personal data in denial evidence.

## Protected Operation Contract

Before a protected operation executes, the owning boundary MUST:

1. Identify the action and subject.
2. Evaluate the actor's production ability.
3. Return a localized denial when unauthorized.
4. Record structured denial evidence.
5. Avoid state mutation on denial.

## Repository Contract

This correction MUST preserve existing repository boundaries and MUST NOT add
direct persistence access or bypass an existing repository check. Broad
repository authorization conformance and direct-Prisma remediation are outside
this feature and remain owned by Spec 055.

## Test Contract

The authorization suite MUST:

- Use production ability construction for role integration tests.
- Cover commands and callbacks.
- Cover GUEST, USER, ADMIN, and SUPER_ADMIN.
- Include missing and disabled actor cases.
- prove zero mutation for denied state-changing operations.
- reject fixtures that assign `manage all` to non-super-admin roles as
  production representations.
