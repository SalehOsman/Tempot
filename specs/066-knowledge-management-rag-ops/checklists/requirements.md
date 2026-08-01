# Requirements Checklist: Knowledge Management RAG Operations

## Security

- [ ] No arbitrary filesystem path accepted from Telegram.
- [ ] Source profile callbacks reject unknown ids.
- [ ] Non-super-admin access is denied before provider execution.
- [ ] Error messages do not expose secrets, database URLs, API keys, or raw
      stack traces.

## UX

- [ ] Main menu contribution is visible only to super admins.
- [ ] Buttons include icons and comply with Telegram row-width limits.
- [ ] Empty states explain the next action.
- [ ] Write and full reindex require explicit confirmation.
- [ ] Expired confirmations are rejected.

## AI/RAG

- [ ] Module declares `hasAI: true`.
- [ ] Module declares `aiDegradationMode: graceful`.
- [ ] Dry-run does not write embeddings or hashes.
- [ ] Write ingestion requires a matching successful dry-run.
- [ ] Status reports zero embeddings as needs-index, not system failure.
- [ ] Test query covers answered, no-context, and degraded states.

## Architecture

- [ ] Module receives an injected operations provider.
- [ ] Module does not import AI, database, provider SDK, or filesystem packages.
- [ ] Bot-server provider reuses `@tempot/ai-core`.
- [ ] Runtime source mounts are documented.
- [ ] Lifecycle events and audit-safe metadata are produced for state changes.
