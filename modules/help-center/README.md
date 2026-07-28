# @tempot/help-center

Active core-platform module that renders contextual help, available commands,
support information, and the first governed AI/RAG assistant entry point inside
Telegram.

- Commands: `/help`, `/ask <question>`
- Minimum role: `USER`
- Required runtime packages: `@tempot/i18n-core`, `@tempot/ai-core`
- Optional package: `@tempot/search-engine`
- AI mode: `hasAI: true`, `aiDegradationMode: graceful`
- Main callback namespace: `help:*`

The module owns Telegram UX, command parsing, callback handling, and localized
response rendering. It receives an optional `HelpAssistantProvider` from
`bot-server`; it does not instantiate AI infrastructure directly.

The current assistant implementation is retrieval-grounded. When the runtime
RAG provider returns context, `/ask` renders the best grounded snippet with
citations. If AI is unavailable or no authorized context is found, the module
renders localized graceful fallback messages.

```bash
pnpm --filter @tempot/help-center build
pnpm --filter @tempot/help-center test
```

Runtime text is provided through `locales/ar.json` and `locales/en.json`.
