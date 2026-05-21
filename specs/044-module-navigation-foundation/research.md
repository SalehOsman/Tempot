# Research: Module Navigation Foundation

## Decision 1: Put reusable navigation contribution contracts in module-registry

**Decision**: Extend the module metadata layer with menu contribution and callback ownership declarations.

**Rationale**: The problem is not specific to `user-management`; it is a cross-module ownership concern. `module-registry` already owns module discovery, manifests, validation, and runtime metadata, so it is the right package to validate duplicate owners, missing owners, and disabled contributions.

**Alternatives considered**:

- Keep menu actions in `user-management`: rejected because it keeps hardcoded cross-module knowledge in one feature module.
- Put all routing in `bot-server`: rejected because bot-server should compose runtime behavior, not own business capability metadata.
- Create a new package: rejected because the responsibility fits existing module registry boundaries.

## Decision 2: Keep feature module callbacks pass-through safe

**Decision**: Each module callback handler must handle only its own namespace or action and call the next middleware for unrelated callback data.

**Rationale**: This preserves independent module ownership and lets the shared fallback handle stale or invalid callbacks consistently.

**Alternatives considered**:

- A central switch over every callback in bot-server: rejected because every new module would require bot-server changes.
- Let every module inspect every callback without pass-through discipline: rejected because one module can accidentally swallow another module's action.

## Decision 3: Hide unavailable actions instead of showing disabled buttons

**Decision**: The main menu must omit actions whose owner is missing, disabled, invalid, or inaccessible to the current user.

**Rationale**: Telegram inline buttons imply immediate action. Showing unavailable actions creates avoidable support burden and repeats the current broken experience.

**Alternatives considered**:

- Show disabled-looking labels: rejected because Telegram inline keyboards do not provide true disabled buttons.
- Show placeholder pages for missing modules: rejected for the foundation slice because it disguises missing architecture and still advertises unavailable features.

## Decision 4: Treat settings, notifications, messages, stats, and help as follow-up module specs

**Decision**: This spec defines ownership and navigation foundation only. Each professional capability receives its own SpecKit flow before implementation.

**Rationale**: Implementing all five modules in one spec would violate single-responsibility delivery, make TDD and review too broad, and risk weak acceptance criteria. The foundation must land first so later modules can plug in cleanly.

**Alternatives considered**:

- Implement all modules together: rejected due to scope and review risk.
- Add temporary handlers in `user-management`: rejected because it violates module ownership and duplicates future module work.

## Decision 5: Require ADR before implementation

**Decision**: Add an ADR for module-owned navigation contributions before production code changes.

**Rationale**: The design introduces a durable cross-module contract and changes how the main Telegram menu is assembled. Constitution Rule XLIV requires an ADR for architectural decisions.

**Alternatives considered**:

- Document only in README: rejected because the decision affects future module contracts and needs ADR-level visibility.
