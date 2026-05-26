# Quickstart: Module Flow Governance

## Purpose

Use this quickstart to validate the first implementation slice after tasks are
executed. It is not a substitute for the full gate list.

## Scenario 1: Review the Pilot Flow Map

1. Select the approved pilot module.
2. Open the module flow map.
3. Confirm all entry points, surfaces, callbacks, unavailable actions, role
   rules, and exits are represented.
4. Confirm leaf pages do not render the callback that opened them unless the
   action performs a documented state change.

Expected result: The Project Manager or Technical Advisor can understand the
module's flow without reading implementation code.

## Scenario 2: Seed and Detect Flow Defects

1. Use a test fixture or controlled module state with a missing visible callback
   handler.
2. Use a test fixture or controlled module state with repeated self-navigation
   on a leaf page.
3. Run the module readiness check for the selected module.

Expected result: The report identifies both seeded defects with severity,
surface, callback, evidence, and correction guidance.

## Scenario 3: Validate Package Reuse Review

1. Open the pilot module capability decision table.
2. Confirm each material capability is classified as Reuse, Compose, Extend
   Package, or Custom Approved.
3. Confirm any Custom Approved entry includes the required exception rationale.

Expected result: No material pilot capability is undocumented.

## Scenario 4: Validate Grounded Assistant Behavior

1. Ask the assistant how to create a Telegram-facing module.
2. Ask a question not covered by approved project sources.

Expected result: The first answer cites approved project sources and reinforces
the methodology. The second answer reports no-context instead of inventing
authority.

## Scenario 5: Run Project Gates

Run the relevant gates after implementation:

```powershell
pnpm spec:validate
pnpm module:checklist
pnpm boundary:audit
pnpm cms:check
pnpm lint
pnpm test:unit
```

Expected result: Gates pass or failures are triaged before merge.
