# Research: settings-management

Decision: compose the existing settings package through bot-server injected
dependencies rather than adding module-local storage.

Decision: do not expose regional settings callbacks that lack implemented behavior.

Rationale: Tempot UX rules require actionable buttons and clear next steps. The
existing account language edit flow is already implemented in `user-management`,
so `settings-management` links to that flow instead of duplicating language
persistence. Timezone and regional defaults are hidden until a future spec
defines their storage and update behavior.
