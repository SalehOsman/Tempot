# ADR-038: Starlight (Astro) over Docusaurus for Documentation Platform

**Date:** 2026-04-05
**Status:** Accepted
**Supersedes:** Docusaurus references in Architecture Spec Section 29 and Constitution Rule LXII

## Context

The Architecture Spec (Section 29) designated Docusaurus 3.x as the documentation platform. This was planned but never implemented — no `apps/docs/` directory exists, no Docusaurus dependencies are installed. Before implementation begins, we re-evaluated the choice against current requirements:

1. **RTL/Arabic support** — Tempot's primary language is Arabic. Docusaurus RTL support requires manual CSS overrides and plugin configuration.
2. **i18n alignment** — Tempot uses i18next internally. Docusaurus uses its own i18n system.
3. **Performance** — Documentation site should be lightweight and fast.
4. **TypeDoc integration** — API reference must be auto-generated from TypeScript source across 13+ packages.
5. **RAG readiness** — Documentation content will be ingested into Tempot's existing RAG pipeline (`@tempot/ai-core`) for AI-assisted developer support.

## Decision

Use **Starlight (Astro)** instead of Docusaurus 3.x for the documentation platform at `apps/docs/`.

## Rationale

| Criterion           | Starlight (Astro)                   | Docusaurus 3.x              |
| ------------------- | ----------------------------------- | --------------------------- |
| RTL support         | Native `dir: 'rtl'` in config       | Manual CSS + plugin         |
| i18n                | Built-in i18next (same as Tempot)   | Custom i18n system          |
| Performance         | Zero JS by default (Astro islands)  | React SPA bundle            |
| TypeDoc integration | `starlight-typedoc` plugin (native) | `docusaurus-plugin-typedoc` |
| Markdown output     | Pure Markdown (RAG-friendly)        | MDX with React components   |
| Built-in components | Tabs, cards, aside, badges included | Requires plugins/custom     |
| Bundle size         | ~50KB base                          | ~300KB+ base                |

### Key advantages for Tempot

1. **starlight-typedoc** supports monorepo via `createStarlightTypeDocPlugin()` — one instance per package, automatic sidebar generation
2. **Astro content collections** produce clean Markdown with typed frontmatter — ideal for RAG ingestion
3. **Zero-JS default** means documentation loads instantly even on slow connections (important for users in MENA region)
4. **i18next compatibility** means translation workflows match Tempot's existing `@tempot/i18n-core` patterns

## Alternatives Considered

| Alternative        | Reason for Rejection                                                  |
| ------------------ | --------------------------------------------------------------------- |
| **Docusaurus 3.x** | No native RTL, different i18n system, heavier bundle, React-dependent |
| **Mintlify**       | Closed-source SaaS ($250/mo+), replaces self-hosted solution          |
| **GitBook**        | Closed-source SaaS ($65-249/mo), no self-hosting                      |
| **ReadMe.com**     | API-focused SaaS, not suitable for framework documentation            |
| **VitePress**      | No native RTL, Vue-based (Tempot has no Vue dependency)               |
| **Fumadocs**       | React/Next.js only, not Astro-compatible                              |

## Consequences

### Positive

- Native RTL and Arabic support from day one
- Consistent i18n approach across project
- Faster documentation site
- Better TypeDoc integration for monorepo
- Clean Markdown output enables RAG ingestion

### Negative

- Smaller ecosystem than Docusaurus (fewer third-party plugins)
- Team may need to learn Astro basics (minimal — Starlight abstracts most complexity)

### Migration Impact

- Architecture Spec Section 29 updated (Docusaurus → Starlight)
- Constitution Rule LXII updated
- ROADMAP Phase 4 updated
- No code migration needed (Docusaurus was never implemented)

## References

- Starlight: https://starlight.astro.build
- starlight-typedoc: https://github.com/HiDeoo/starlight-typedoc
- typedoc-plugin-markdown: https://github.com/typedoc2md/typedoc-plugin-markdown
