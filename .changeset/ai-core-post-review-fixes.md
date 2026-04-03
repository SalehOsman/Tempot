---
"@tempot/ai-core": patch
"@tempot/event-bus": patch
---

fix(ai-core): post-review fixes — dead code removal, module-reviewer rewrite, tool version events

Code fixes:
- Rewrite ModuleReviewer with 5 structured checks (config-completeness, missing-events, ux-compliance, i18n-completeness, test-suggestions)
- Remove dead code: PROVIDER_REFUSAL error code, AIDegradationMode type
- Remove phantom dependency @langfuse/otel
- Add tool version change event emission in ToolRegistry

Cross-package changes:
- event-bus: Add ai-core.tool.version_changed event type

Documentation fixes:
- Update AI SDK version references from 4.x to 6.x across CLAUDE.md, README.md, plan.md
- Fix toggle default description (enabled by default, not disabled)
- Add ADR-037 references to README.md and tempot_v11_final.md
- Update spec.md HNSW index code to halfvec expression indexing
- Remove @langfuse/otel references from plan.md
- Update tempot_v11_final.md §17: directory structure, remove cohere provider, dims 1536→3072, halfvec note
