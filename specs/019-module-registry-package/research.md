# Research: Module Registry

## Decisions

### 1. Configuration Validation Library

- **Decision:** Use `zod ^4.3.6` for module configuration validation.
- **Rationale:** Zod provides declarative schema definition with type inference, refinement support (e.g., `aiDegradationMode` required when `hasAI` is true), and detailed error messages. The project already uses zod 4.x in the settings package for validation. Using the same library ensures consistency.
- **Alternatives considered:** Manual validation with `if` checks (rejected — verbose, error-prone, no automatic type inference). `joi` (rejected — not TypeScript-first, project already standardized on zod). Type-only validation via TypeScript satisfies operator (rejected — no runtime validation, which is the core requirement).

### 2. Module Config Loading Strategy

- **Decision:** Use dynamic `import()` to load `module.config.ts` files at runtime. Expect a default export of type `ModuleConfig`.
- **Rationale:** Dynamic import is the ESM-native mechanism for loading modules. It handles TypeScript files naturally when running under a TypeScript-aware runtime (tsx, ts-node) or when modules are pre-compiled. Default export is the convention established in the architecture spec's examples.
- **Alternatives considered:** `require()` (rejected — the project is ESM-only with `"type": "module"`). Reading config as JSON (rejected — modules use TypeScript config files, not JSON). `fs.readFile` + eval (rejected — security risk, no module resolution).

### 3. Filesystem Access Pattern

- **Decision:** Use Node.js `fs/promises` API (`readdir`, `stat`, `access`) for directory scanning and file existence checks. All filesystem operations are wrapped in try-catch and return `Result<T, AppError>`.
- **Rationale:** `fs/promises` is the standard Node.js API for async filesystem operations. Wrapping in Result pattern follows Constitution Rule XXI. No external library is needed for the simple operations required (directory listing, file existence checks).
- **Alternatives considered:** `glob` or `fast-glob` (rejected — overkill for simple directory scanning, adds an unnecessary dependency). Synchronous `fs` (rejected — blocks the event loop during startup, though startup is sequential this is still bad practice).

### 4. In-Memory Registry Data Structure

- **Decision:** Use `Map<string, ValidatedModule>` for the in-memory registry. Module name is the key.
- **Rationale:** `Map` provides O(1) lookup by name, which is the primary query pattern (bot-server looks up modules by name). It also preserves insertion order for iteration. The registry is populated once at startup and is read-only afterward.
- **Alternatives considered:** Plain object / `Record<string, ValidatedModule>` (rejected — Map has better semantics for a registry: `.has()`, `.get()`, `.values()`, `.size`). Array with `find()` (rejected — O(n) lookup, less appropriate for a keyed collection).

### 5. Spec Gate Matching Algorithm

- **Decision:** Match module names against spec directory names by checking if the directory name (after removing the `{NNN}-` numeric prefix) matches `{module-name}` or `{module-name}-package`. Scan the `specs/` directory and look for a matching directory containing `spec.md`.
- **Rationale:** The spec directory naming convention is `{NNN}-{feature-name}` or `{NNN}-{feature-name}-package`. Some packages use the `-package` suffix and some don't. The matching algorithm must handle both. Reading the specs directory is a one-time operation at startup.
- **Alternatives considered:** Exact match only (rejected — would fail for directories with `-package` suffix). Regex pattern (rejected — over-engineered for two simple cases). Configuration-based mapping (rejected — adds maintenance burden, the naming convention is deterministic).

### 6. Package Availability Check Strategy

- **Decision:** Check package availability by verifying the directory exists in `packages/`. For packages with toggle guards (Section 30), additionally check the `TEMPOT_{NAME}` environment variable — if explicitly `"false"`, the package is considered unavailable.
- **Rationale:** Filesystem existence check is reliable and fast. The toggle guard check ensures modules don't claim availability of disabled packages. The environment variable naming follows the convention from Section 30 of the architecture spec.
- **Alternatives considered:** Check `package.json` dependencies (rejected — a package may be installed but disabled via toggle). Check if the package's module can be imported (rejected — importing every package at validation time has side effects and performance implications). Only filesystem check without toggle (rejected — would miss intentionally disabled packages).

### 7. Event Emission Strategy

- **Decision:** Emit events via the injected `RegistryEventBus` interface. Six event types covering discovery completion, module validation success/failure, module skip, module registration, and module disable alert. Events are fire-and-forget — emission failures are logged but do not fail the pipeline.
- **Rationale:** Constitution Rule XV mandates event-driven communication. Rule LVII requires SUPER_ADMIN alerts for module disabling. Fire-and-forget ensures the startup pipeline is not blocked by slow event subscribers or event bus failures.
- **Alternatives considered:** No events (rejected — violates Rule XV and Rule LVII). Synchronous event handling (rejected — would block startup for each subscriber). Direct logger calls only (rejected — violates event-driven architecture requirement).

### 8. Dependency Injection Approach

- **Decision:** Use constructor injection with a typed dependencies object (`deps: { ... }`). Services depend on interfaces (`RegistryLogger`, `RegistryEventBus`, `ModuleDiscoveryPort`, `ModuleValidatorPort`), not concrete implementations.
- **Rationale:** Interface-based injection follows the project's established patterns (settings package uses `SettingsLogger`, `SettingsEventBus`). It enables unit testing with mock implementations, satisfies the ESLint max-params rule (single deps object instead of multiple constructor parameters), and avoids phantom dependencies on `@tempot/logger` and `@tempot/event-bus`.
- **Alternatives considered:** Direct imports of logger and event-bus (rejected — creates phantom dependencies and tight coupling). Service locator pattern (rejected — hides dependencies, harder to test). No DI / globals (rejected — untestable).

### 9. Error Handling for Module Loading

- **Decision:** Module config loading errors (syntax errors, missing exports, import failures) are caught and reported as discovery failures. For core modules, these propagate as fatal errors. For optional modules, they result in the module being skipped with a warning.
- **Rationale:** Module config files are user-authored TypeScript that may contain any kind of error. The registry must be resilient to bad module code and report errors clearly. The core/optional distinction ensures that critical modules cannot be silently skipped.
- **Alternatives considered:** Fail all discovery on first error (rejected — prevents discovering valid modules after one bad one). Ignore all loading errors (rejected — would silently skip core modules). Retry loading (rejected — if a config file has a syntax error, retrying won't help).

### 10. Command Registration Approach

- **Decision:** The registry provides a `register(bot)` method that takes a grammY `Bot` instance and sets the bot's commands via `bot.api.setMyCommands()`. The registry does NOT set up message handlers or middleware — it only registers command metadata with Telegram's command menu.
- **Rationale:** Command registration (telling Telegram what commands exist) is a data operation that the registry can handle because it has all the command definitions. Message/command handling (responding to commands) is the bot-server's responsibility — it requires access to module handlers, middleware chains, and session context that the registry does not own. This clean separation follows D11 in spec.md.
- **Alternatives considered:** Full handler registration (rejected — the registry would need to know about module internals, breaking separation of concerns). No registration at all (rejected — the bot-server would need to manually wire commands from registry data, duplicating logic). Hook-based registration (rejected — adds complexity without clear benefit).
