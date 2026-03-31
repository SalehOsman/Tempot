# Research: i18n Core

## Decisions

### 1. Translation Engine

- **Decision:** Use `i18next` as the translation engine for all components (FR-001).
- **Rationale:** Mature ecosystem with built-in support for pluralization, interpolation, context variants, and namespace-based loading. Widely adopted in the Node.js ecosystem. Required by project specification.
- **Alternatives considered:** `intl-messageformat` (rejected — lacks namespace/module loading), custom implementation (rejected — unnecessary complexity for a solved problem).

### 2. Modular Locale Loading

- **Decision:** Use `glob` to scan `modules/*/locales/*.json` and register each file as an i18next resource bundle via `addResourceBundle()` (FR-004).
- **Rationale:** Enables each module to own its translations independently. No central registry needed — modules simply place locale files in the conventional path. Returns `Result<void, AppError>` per Rule XXI.
- **Alternatives considered:** Manual import map (rejected — does not scale with module count), `i18next-fs-backend` (rejected — adds unnecessary dependency when glob + readFile is sufficient).

### 3. Session-Based Language Detection

- **Decision:** Use `AsyncLocalStorage` via `@tempot/session-manager`'s `sessionContext` to automatically detect the current user's language in `t()` (FR-005).
- **Rationale:** Eliminates the need to pass language as a parameter through every function call. Each request context carries the user's language preference, making `t()` a zero-argument call for the common case.
- **Alternatives considered:** Explicit `lang` parameter on every `t()` call (rejected — verbose and error-prone), global mutable state (rejected — not request-safe in concurrent environments).

### 4. t() Return Type — String (Rule XXI Exemption)

- **Decision:** `t()` returns `string` directly, not `Result<string, AppError>`, as an explicit exemption from Rule XXI.
- **Rationale:** i18next's `t()` function never throws — missing keys return the key name itself. Wrapping an infallible operation in `Result` adds ceremony without safety benefit. This exemption is documented in spec FR-005.
- **Alternatives considered:** `Result<string, AppError>` wrapper (rejected — `t()` cannot fail, making `Result.err` unreachable dead code).

### 5. Locale File Validation

- **Decision:** Use Zod schemas for locale file validation (FR-007). `LocaleSchema` validates structure, `generateSchemaFromSource()` enforces key parity between source (`ar.json`) and target (`en.json`) locales.
- **Rationale:** Zod is already in the project stack. Strict schema generation from the source locale ensures no missing or extra keys in translations, catching parity issues at build time rather than runtime.
- **Alternatives considered:** JSON Schema (rejected — less ergonomic in TypeScript), manual key comparison (rejected — fragile and does not validate nesting depth).

### 6. Hardcoded String Detection

- **Decision:** Implement heuristic-based detection in `cms:check` script using regex pattern matching to identify human-readable strings in source code (FR-002, FR-007).
- **Rationale:** Detects Arabic text (Unicode range), English sentences/phrases (multi-word capitalized strings), while excluding technical patterns (URLs, identifiers, dotted keys, regex, numbers). Runs as `pnpm cms:check` in CI/CD pipeline.
- **Alternatives considered:** Full AST parsing via `ts-morph` (rejected — heavyweight for string detection), ESLint plugin (rejected — adds runtime dependency for a build-time check).

### 7. Translation Value Security

- **Decision:** Use `sanitize-html` to strip dangerous HTML tags from translation values, allowing only safe formatting tags (`<b>`, `<i>`, `<em>`, `<strong>`, `<a>`, `<p>`, `<br>`).
- **Rationale:** Translation files may be edited by non-developers (translators). Sanitization prevents XSS-style injection if malicious content enters locale files. Only `href` attributes are allowed on `<a>` tags.
- **Alternatives considered:** DOMPurify (rejected — browser-focused, heavier dependency for server-side use), no sanitization (rejected — violates defense-in-depth principle).
