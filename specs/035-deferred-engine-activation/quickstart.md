# Quickstart: Deferred Engine Activation

1. Review the activation record in `docs/archive/ROADMAP.md`.
2. Confirm package specs are complete:
   - `specs/016-document-engine-package`
   - `specs/017-import-engine-package`
   - `specs/014-search-engine-package`
3. Run `corepack pnpm spec:validate`.
4. Start the first implementation branch for `document-engine` only.
5. After `document-engine` merges, start `import-engine`.
6. After `import-engine` merges, start `search-engine`.
