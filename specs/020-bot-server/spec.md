# Feature Specification: Bot Server (Application Entry Point & Assembly Layer)

**Feature Branch**: `020-bot-server`
**Created**: 2026-04-05
**Updated**: 2026-04-05
**Status**: Complete
**Input**: User description: "Build the bot-server application — the main entry point that assembles all infrastructure packages and business modules into a running Telegram bot with an HTTP server."
**Architecture Reference**: Sections 15.7, 20, 25.3, 25.4, 26.2, 28, 30 of `docs/tempot_v11_final.md`
**ADR Reference**: ADR-020 (input sanitization + bot-side rate limiting)

## User Scenarios & Testing _(mandatory)_

### User Story 1 — Application Startup (Priority: P0)

As a system operator, I want the application to initialize all subsystems in the correct order at startup, so that the bot is fully functional and ready to serve users before accepting any traffic.

**Why this priority**: The application cannot function at all without a correct startup sequence. Every other feature depends on successful initialization.

**Independent Test**: Start the application with valid configuration. Verify that each subsystem initializes in the documented order: static settings load → super admin bootstrap → cache warming (settings first, then translations) → module discovery → module validation → module handler loading → command registration → HTTP server start. Verify the startup completion event is emitted.

**Acceptance Scenarios**:

1. **Given** all required environment variables are set and all subsystems are available, **When** the application starts, **Then** it completes the full startup sequence and emits a system startup completed event with the total startup duration.
2. **Given** the bot token environment variable is missing, **When** the application attempts to start, **Then** it exits immediately with a fatal error describing the missing configuration.
3. **Given** the database is unreachable at startup, **When** the application attempts to start, **Then** it exits with a fatal error describing the connection failure, because the database is required for core operations.

---

### User Story 2 — Module Discovery and Validation at Startup (Priority: P0)

As a system operator, I want the application to automatically discover and validate all business modules at startup, so that only structurally sound modules with satisfied dependencies are loaded into the running bot.

**Why this priority**: Module discovery and validation are prerequisites for loading any business logic. Without them, the bot has no functionality.

**Independent Test**: Start the application with a modules directory containing both valid and invalid modules. Verify that valid modules are discovered, validated, and their handlers loaded. Verify that a core module failure halts the application. Verify that a non-core module failure logs a warning and continues.

**Acceptance Scenarios**:

1. **Given** a modules directory with three valid modules (two core, one optional), **When** the application starts, **Then** all three are discovered, validated, and their handlers loaded successfully.
2. **Given** a core module fails validation (e.g., missing required dependency), **When** the application starts, **Then** it halts with a fatal error identifying the core module and the validation failure.
3. **Given** a non-core module fails validation, **When** the application starts, **Then** it logs a warning with the module name and failure reason, skips the module, and continues startup with the remaining modules.
4. **Given** a module's handler loading (setup function) throws an error and the module is core, **When** the application starts, **Then** it halts with a fatal error.
5. **Given** a module's handler loading throws an error and the module is non-core, **When** the application starts, **Then** it logs a warning and continues without that module.

---

### User Story 3 — Security Middleware Chain (Priority: P0)

As a system operator, I want every incoming bot update to pass through a mandatory security middleware chain in a fixed order, so that all requests are sanitized, rate-limited, authenticated, and validated before reaching business logic.

**Why this priority**: Security by Default is a constitutional requirement (Architecture Spec Section 20). The middleware chain cannot be optional or reorderable.

**Independent Test**: Send a bot update through the middleware pipeline. Verify that the middlewares execute in exact order: input sanitization → rate limiting → authentication/authorization → input validation → business logic → audit logging. Verify that a request blocked at any stage does not reach subsequent stages.

**Acceptance Scenarios**:

1. **Given** a valid, authenticated user sends a command, **When** the update is processed, **Then** it passes through all six middleware stages in order and the handler executes.
2. **Given** a user sends input containing potentially dangerous content, **When** the input sanitization middleware processes it, **Then** the dangerous content is neutralized before any subsequent middleware sees it.
3. **Given** a user exceeds the rate limit, **When** the rate limiting middleware processes the update, **Then** the update is rejected and the user receives a localized rate limit message. The request does not reach the authentication stage.
4. **Given** a user without the required role attempts a restricted command, **When** the authorization middleware processes it, **Then** the update is rejected with a localized unauthorized message. The request does not reach the business logic handler.

---

### User Story 4 — Dual Operation Modes (Priority: P0)

As a developer, I want to run the bot in polling mode for local development without needing a public IP or HTTPS, and as a deployer, I want to run it in webhook mode for production with proper HTTPS verification, so that the same application works in both environments.

**Why this priority**: Without dual mode support, development workflow is blocked (no local testing without public IP) or production deployment is impossible (no webhook reception).

**Independent Test**: Start the application in polling mode and verify it connects to the bot API via long polling without starting the webhook route. Then start it in webhook mode and verify it starts the HTTP server with a webhook endpoint and does not use polling. Verify that the mode is determined by environment configuration and requires a restart to change.

**Acceptance Scenarios**:

1. **Given** the operation mode is set to polling, **When** the application starts, **Then** it connects via long polling and does not start a webhook route.
2. **Given** the operation mode is set to webhook, **When** the application starts, **Then** it starts the HTTP server with a webhook endpoint and does not use long polling.
3. **Given** the operation mode is set to an invalid value, **When** the application starts, **Then** it exits with a fatal error describing the valid options.
4. **Given** the application is running in one mode, **When** the operator wants to switch modes, **Then** they must change the environment variable and restart the application. No hot-switching is supported.

---

### User Story 5 — Webhook Reception and Verification (Priority: P0)

As a system operator, I want the webhook endpoint to verify incoming requests using a secret token header, so that only authentic updates from the Telegram API are processed and all forged requests are rejected.

**Why this priority**: Without webhook verification, any attacker could send forged updates to the bot, compromising security.

**Independent Test**: Send an HTTP request to the webhook endpoint with the correct secret token header and verify it is accepted. Send a request without the header or with an incorrect value and verify it is rejected with an appropriate status code.

**Acceptance Scenarios**:

1. **Given** a POST request arrives at the webhook endpoint with the correct secret token header, **When** the server processes it, **Then** the update is forwarded to the bot engine for processing.
2. **Given** a POST request arrives without a secret token header, **When** the server processes it, **Then** it responds with an unauthorized status and the update is not processed.
3. **Given** a POST request arrives with an incorrect secret token, **When** the server processes it, **Then** it responds with an unauthorized status and the update is not processed.

---

### User Story 6 — Health Check Endpoint (Priority: P1)

As a system operator, I want a health check endpoint that reports the status of all subsystems with latency measurements and an overall health classification, so that I can monitor the application's health and integrate with orchestration platforms.

**Why this priority**: Health checks are essential for production monitoring and container orchestration but do not block core bot functionality.

**Independent Test**: Call the health check endpoint and verify it returns the status of each subsystem (database, cache, queue, AI provider, disk) with latency in milliseconds. Verify the overall status classification: healthy when all subsystems are OK, degraded when AI or disk has issues, unhealthy when database or cache is down.

**Acceptance Scenarios**:

1. **Given** all subsystems are operational, **When** the health check endpoint is called, **Then** it returns a healthy status with latency measurements for each subsystem.
2. **Given** the database is unreachable, **When** the health check endpoint is called, **Then** it returns an unhealthy status with the database check showing a failure.
3. **Given** the AI provider is unavailable but all other subsystems are fine, **When** the health check endpoint is called, **Then** it returns a degraded status.
4. **Given** the disk space is critically low, **When** the health check endpoint is called, **Then** it returns a degraded status with the disk check showing the issue.
5. **Given** the health check endpoint is called, **When** it responds, **Then** the response includes the application version and uptime in seconds.

---

### User Story 7 — Graceful Shutdown (Priority: P0)

As a system operator, I want the application to shut down gracefully when receiving a termination signal, completing in-flight work and closing resources in the correct order within a bounded timeout, so that no data is lost and no connections are left dangling.

**Why this priority**: Ungraceful shutdown causes data loss, connection leaks, and corrupted state. This is a constitutional requirement (Rule XVII, Architecture Spec Section 25.3).

**Independent Test**: Send a SIGTERM to the running application. Verify that it stops accepting new HTTP requests, completes in-flight bot updates within 10 seconds, drains queue workers within 15 seconds, closes cache, primary database, and vector database connections each within 5 seconds, and logs shutdown completion. Verify that if the total exceeds 30 seconds, the process exits with a fatal error.

**Acceptance Scenarios**:

1. **Given** the application is running with active connections, **When** SIGTERM is received, **Then** the shutdown sequence executes in order: stop HTTP → complete bot updates (10s) → drain queues (15s) → close cache (5s) → close primary DB (5s) → close vector DB (5s) → log completion.
2. **Given** the shutdown sequence completes within 30 seconds, **When** all resources are released, **Then** the process exits cleanly with code 0.
3. **Given** the shutdown sequence exceeds 30 seconds, **When** the timeout is reached, **Then** the process exits with code 1 and a fatal error is logged.
4. **Given** SIGINT is received (e.g., Ctrl+C), **When** the signal is processed, **Then** the same graceful shutdown sequence executes as for SIGTERM.

---

### User Story 8 — Super Admin Bootstrap (Priority: P0)

As a system operator, I want super admin users to be bootstrapped from environment configuration at startup, so that administrative access is available immediately when the application starts and before any module handlers are registered.

**Why this priority**: Super admin checks must work during module setup. If admins are not bootstrapped first, authorization checks during startup will fail.

**Independent Test**: Set the super admin IDs environment variable with two Telegram user IDs. Start the application. Verify that both users exist in the authorization system with SUPER_ADMIN role before module registration begins.

**Acceptance Scenarios**:

1. **Given** SUPER_ADMIN_IDS contains two valid user IDs, **When** the application starts, **Then** both users are created or updated in the authorization system with SUPER_ADMIN role before module discovery begins.
2. **Given** SUPER_ADMIN_IDS is empty or not set, **When** the application starts, **Then** it logs a warning that no super admins are configured but continues startup (the system operates without admin override capabilities).
3. **Given** SUPER_ADMIN_IDS contains an invalid value (non-numeric), **When** the application starts, **Then** it exits with a fatal error describing the invalid format.

---

### User Story 9 — Global Error Boundary (Priority: P1)

As a user, I want to receive a friendly localized error message with a unique reference code when something goes wrong, so that I can report the issue and support can trace it. As an operator, I want the full error logged and reported to the monitoring service.

**Why this priority**: Error boundary prevents unhandled errors from crashing the bot and provides traceability for debugging. Important for production stability but not a startup blocker.

**Independent Test**: Trigger an unhandled error in a bot handler. Verify that the user receives a localized error message containing a reference code in the format ERR-YYYYMMDD-XXXX. Verify that the full error with stack trace is logged. Verify that the error is reported to the monitoring service (when enabled). Verify that the error event is emitted via the event bus.

**Acceptance Scenarios**:

1. **Given** an unhandled error occurs in a bot handler, **When** the error boundary catches it, **Then** a unique reference code (ERR-YYYYMMDD-XXXX) is generated and included in the user-facing localized error message.
2. **Given** an error is caught by the error boundary, **When** it is processed, **Then** the full error including stack trace, reference code, user ID, and chat ID is logged.
3. **Given** error monitoring is enabled (via toggle), **When** an error is caught, **Then** it is reported to the monitoring service with the reference code as a tag.
4. **Given** error monitoring is disabled (via toggle), **When** an error is caught, **Then** it is only logged locally; no external reporting occurs.
5. **Given** an error occurs, **When** the error boundary processes it, **Then** a system error event is emitted via the event bus containing the reference code.

---

### User Story 10 — Maintenance Mode (Priority: P1)

As a system operator, I want to enable maintenance mode so that all users receive a localized "system under maintenance" message while super admins can continue using the bot normally, so that I can perform system maintenance without user disruption.

**Why this priority**: Maintenance mode is essential for operational control but not a startup blocker. It relies on settings service and auth checks already being operational.

**Independent Test**: Enable maintenance mode via settings. Send a message as a regular user and verify they receive the maintenance message. Send a message as a super admin and verify they can use the bot normally. Disable maintenance mode and verify regular users can use the bot again.

**Acceptance Scenarios**:

1. **Given** maintenance mode is enabled, **When** a regular user sends any update, **Then** they receive a localized "system under maintenance" message and their request is not processed.
2. **Given** maintenance mode is enabled, **When** a super admin sends an update, **Then** their request is processed normally, bypassing the maintenance check.
3. **Given** maintenance mode is disabled, **When** any user sends an update, **Then** their request is processed normally.
4. **Given** maintenance mode is toggled while the bot is running, **When** the next update arrives, **Then** the new maintenance state takes effect immediately (no restart needed).

---

### User Story 11 — Cache Warming at Startup (Priority: P1)

As a system operator, I want critical caches to be warmed at startup in a specific order, so that the first user requests are served from cache rather than hitting the database, and so that maintenance mode can be checked before any user traffic is accepted.

**Why this priority**: Cache warming prevents cold-start latency spikes and ensures maintenance mode is checked before accepting traffic. Important for user experience but not a strict startup blocker.

**Independent Test**: Start the application and verify that system settings are loaded into cache first (enabling maintenance mode check), then translation strings are loaded into cache (enabling localized responses). Verify the order cannot be inverted.

**Acceptance Scenarios**:

1. **Given** the application is starting, **When** cache warming executes, **Then** system settings are warmed first, followed by translation strings.
2. **Given** settings cache warming fails, **When** the startup sequence continues, **Then** it logs a warning but continues (the system falls back to database reads).
3. **Given** translation cache warming fails, **When** the startup sequence continues, **Then** it logs a warning but continues (the system falls back to loading translations on demand).

---

### User Story 12 — System Lifecycle Events (Priority: P1)

As a monitoring system, I want to receive system lifecycle events through the event bus, so that I can track when the system starts, shuts down, and encounters errors.

**Why this priority**: Lifecycle events enable observability and integration with monitoring systems. Important for production but not a startup blocker.

**Independent Test**: Start the application and verify a system startup completed event is emitted. Trigger a shutdown and verify system shutdown initiated and system shutdown completed events are emitted. Trigger an error and verify a system error event is emitted with the reference code.

**Acceptance Scenarios**:

1. **Given** the application completes startup, **When** all subsystems are initialized, **Then** a `system.startup.completed` event is emitted with startup duration.
2. **Given** a shutdown signal is received, **When** the shutdown sequence begins, **Then** a `system.shutdown.initiated` event is emitted.
3. **Given** the shutdown sequence completes, **When** all resources are released, **Then** a `system.shutdown.completed` event is emitted with shutdown duration.
4. **Given** an unhandled error occurs, **When** the error boundary processes it, **Then** a `system.error` event is emitted with the error reference code.

---

### User Story 13 — Scoped User Enforcement (Priority: P1)

As a module developer, I want to restrict a module's commands to specific Telegram user IDs defined in the module configuration, so that only authorized users can access that module's functionality regardless of their role.

**Why this priority**: Scoped user enforcement is a per-module access control feature. Important for modules in testing or restricted deployment but not a startup blocker.

**Independent Test**: Configure a module with a scopedUsers list containing two user IDs. Send a command from a listed user and verify access is granted. Send the same command from an unlisted user and verify they receive a "not authorized" response.

**Acceptance Scenarios**:

1. **Given** a module has a scopedUsers list with user IDs [111, 222], **When** user 111 sends a command from that module, **Then** the command is processed normally.
2. **Given** a module has a scopedUsers list with user IDs [111, 222], **When** user 333 sends a command from that module, **Then** they receive a localized "not authorized" response and the command is not processed.
3. **Given** a module does not have a scopedUsers list (undefined or empty), **When** any authorized user sends a command, **Then** no scoped user check is applied and the normal authorization flow continues.
4. **Given** a super admin is not in a module's scopedUsers list, **When** they send a command from that module, **Then** they are also blocked — scopedUsers overrides role-based access for that specific module.

## Edge Cases

- **No modules directory**: If the modules directory does not exist at startup, the module discovery step returns an empty result and the application starts with zero business modules (bot responds only to built-in commands, if any). A warning is logged.
- **All modules are non-core and all fail**: The application starts successfully with zero loaded modules. A warning is logged indicating no modules were loaded.
- **Duplicate module names**: If two directories contain modules with the same name, the module registry rejects the duplicate during validation (handled by module-registry package, not bot-server).
- **Handler setup function missing**: If a validated module's entry point does not export a setup function, the bot-server treats this as a handler loading failure (fatal for core, warning for non-core).
- **Handler setup function throws synchronously**: Same behavior as async failure — caught by the error boundary around handler loading.
- **Webhook endpoint receives non-JSON body**: The request is rejected with a bad request status. No crash.
- **Webhook endpoint receives GET instead of POST**: The request is rejected with method not allowed status.
- **Health check during startup**: If the health check endpoint is called before all subsystems are initialized, it returns unhealthy with the uninitialized subsystems showing as unavailable.
- **SIGTERM during startup**: If a termination signal arrives during the startup sequence, the application cancels startup and runs whatever shutdown steps are applicable for the resources that have been initialized so far.
- **Multiple SIGTERM signals**: Only the first signal triggers the shutdown sequence. Subsequent signals are ignored (the shutdown is already in progress).
- **Cache warming partial failure**: If settings cache warms but translation cache fails, the application still starts. Translations are loaded on-demand with a latency penalty.
- **Error reference counter overflow**: The XXXX portion of the error reference code wraps or uses random hex to avoid overflow concerns within a single process lifetime.
- **Super admin ID already exists**: If a super admin ID already exists in the authorization system, it is updated to SUPER_ADMIN role (idempotent operation).
- **Maintenance mode enabled at startup**: The maintenance check middleware is applied after startup. If maintenance mode is already enabled when the bot starts, all non-admin updates are intercepted immediately.
- **Concurrent shutdown and startup**: If SIGTERM arrives during cache warming or module loading, partially initialized resources are cleaned up. The shutdown sequence only runs cleanup for resources that were successfully initialized.
- **Module with no commands**: A module that passes validation but defines zero commands is still loaded (it may register event listeners or background tasks). It simply contributes no commands to the Telegram API registration.
- **Health check when cache is rebuilding**: If the cache is being rebuilt after a backend failure, the health check reports cache status as degraded, not unhealthy, because the fallback (direct DB reads) is operational.

## Design Decisions & Clarifications (updated after /speckit.clarify)

### D1. Application, Not a Library

bot-server is an APPLICATION in `apps/bot-server/`, not a reusable package in `packages/`. It does not export anything. It is the entry point that assembles and runs all packages and modules. All artifacts, documentation, and code must use "application" terminology.

### D2. Module Handler Loading Mechanism

Each validated module's entry point (`index.ts`) exports a default setup function that receives the bot instance and a dependency container (logger, event bus, session provider, i18n, settings). The bot-server dynamically imports each module and calls its setup function after module-registry validation completes. If a core module's setup fails, the application halts. If a non-core module's setup fails, a warning is logged and startup continues without that module.

### D3. Security Middleware Order is Fixed

The middleware chain order is non-negotiable: sanitization → rate limiting → authentication/authorization → input validation → business logic → audit logging. This is a security requirement from Architecture Spec Section 20. The order cannot be changed by configuration or at runtime.

### D4. Health Check Classification Rules

Health check probes each subsystem independently:

- Database or cache down → overall status is **unhealthy**
- AI provider or disk has issues → overall status is **degraded**
- All subsystems OK → overall status is **healthy**

The response includes latency in milliseconds for each subsystem. The health check must complete within a bounded timeout (e.g., 5 seconds) even if a subsystem is unresponsive.

### D5. Error Reference Code Format

Format: `ERR-YYYYMMDD-XXXX` where XXXX is a random 4-character hex string. The reference links the user-facing message, audit log entry, and error monitoring event. The existing `generateErrorReference()` function from `@tempot/shared` already produces this format and will be reused.

### D6. Webhook Verification

The webhook endpoint verifies incoming requests by comparing the `X-Telegram-Bot-Api-Secret-Token` header value against the configured webhook secret. The secret is set via environment variable. Requests without the header or with an incorrect value receive an unauthorized response.

### D7. Cache Warming Order

Settings are warmed first because maintenance mode must be checkable before any user traffic is processed. Translation strings are warmed second because they are needed for user-facing responses. If either warming step fails, the application logs a warning and continues (graceful degradation — the system falls back to on-demand loading).

### D8. Super Admin Bootstrap Timing

Super admin users are bootstrapped BEFORE module discovery and registration. This ensures that authorization checks work correctly during module setup (some modules may need to verify admin permissions during initialization).

### D9. Maintenance Mode Middleware

When maintenance mode is enabled (via settings), a middleware intercepts ALL incoming bot updates and replies with a localized "system under maintenance" message. Only users with SUPER_ADMIN role bypass this check. The maintenance mode state is read from settings on each request (or from cache with short TTL).

### D10. Dual Mode — No Hot-Switching

The `BOT_MODE` environment variable determines the operation mode: `polling` for development, `webhook` for production. Changing the mode requires restarting the application. There is no API or command to switch modes at runtime.

### D11. Dashboard/Mini-App API Routes — Out of Scope

The HTTP server is structured to allow future route additions, but only the webhook endpoint and health check endpoint are implemented in this specification. Dashboard and mini-app API routes are deferred to Phase 4.

### D12. Testing Strategy for an Application

Since bot-server is an APPLICATION (not a library), the testing strategy focuses on:

- Unit tests for individual middleware functions, startup logic, and utility functions
- Integration tests for the startup sequence using mocked package dependencies
- Health check endpoint tests using a test HTTP client
- End-to-end tests with a real Telegram API are out of scope

### D13. Scoped User Enforcement Positioning

The scoped user check happens BEFORE routing to the module handler, after the general authentication/authorization middleware. The check compares the incoming user's Telegram ID against the module's `scopedUsers` list. If the list exists and the user is not in it, they receive a "not authorized" response regardless of their role. Super admins are NOT exempt from scoped user checks — this is intentional, as scoped users is a module-level access control independent of roles.

### D14. Startup Failure Semantics

Startup failures are categorized:

- **Fatal**: Missing bot token, database unreachable, core module validation failure, core module handler loading failure → application exits immediately with a non-zero exit code.
- **Warning**: No modules directory, non-core module failure, cache warming failure → logged and startup continues.

### D15. HTTP Server Scope

The HTTP server serves three concerns in webhook mode:

1. Webhook endpoint (receives bot updates)
2. Health check endpoint (returns subsystem status)
3. Placeholder structure for future API routes (dashboard, mini-apps)

In polling mode, the HTTP server still starts for the health check endpoint but does not register the webhook route.

### D16. Lifecycle Event Payloads

System lifecycle events carry relevant context:

- `system.startup.completed`: startup duration in milliseconds, number of modules loaded, operation mode
- `system.shutdown.initiated`: reason (signal type)
- `system.shutdown.completed`: shutdown duration in milliseconds
- `system.error`: error reference code, error code, module where error occurred (if known)

### D17. Command Registration Timing

Commands are registered with the Telegram API via module-registry's `register()` method AFTER all modules are validated and their handlers are loaded. This ensures that only commands from successfully loaded modules are visible to users.

### D18. Audit Logging Middleware Position

The audit logging middleware is the LAST in the chain (position 6). It records the result of the request processing — success or failure — including the user ID, action taken, and whether the request was allowed or denied. This position ensures it captures the final outcome.

### D19. Rate Limiting Scopes

Rate limiting operates at multiple scopes as defined in Architecture Spec Section 20:

- General messages: 30 per minute
- Commands: 10 per minute
- File uploads: 5 per 10 minutes
- AI requests: 20 per hour
- Repeated denied access: 5 attempts per 10 minutes → temporary ban + alert

### D20. Scoped Users and Empty Lists

If a module's `scopedUsers` field is `undefined` or an empty array, no scoped user check is applied for that module. Only when the list contains at least one user ID does the enforcement activate.

### D21. Startup Order Rationale

The startup order is: static settings → super admin bootstrap → cache warming → module discovery → module validation → module handler loading → command registration → HTTP server start. Each step depends on the previous: settings provide the bot token and super admin IDs, super admins must exist before module setup runs auth checks, cache must be warm for maintenance mode checks during module loading, modules must be validated before loading handlers, handlers must be loaded before registering commands, and the HTTP server starts last to ensure the bot is fully ready before accepting traffic.

### D22. HTTP Server in Polling Mode

In polling mode, the HTTP server still starts for the health check endpoint. The webhook route is not registered. This allows monitoring and orchestration tools to check the bot's health even during local development.

### D23. Multiple Webhook Requests During Processing

The webhook endpoint must handle concurrent requests. Each incoming webhook request is processed independently. The bot engine handles update sequencing internally.

### D24. Environment Variables Required

The application requires these environment variables:

- `BOT_TOKEN` (required) — Telegram bot API token
- `BOT_MODE` (required) — `polling` or `webhook`
- `WEBHOOK_URL` (required in webhook mode) — Public HTTPS URL for the webhook endpoint
- `WEBHOOK_SECRET` (required in webhook mode) — Secret token for webhook verification
- `SUPER_ADMIN_IDS` (optional) — Comma-separated Telegram user IDs
- `DATABASE_URL` (required) — Database connection string
- All `TEMPOT_*` toggle variables from the pluggable architecture system (optional, defaults defined in module-registry)

### D25. Port Configuration

The HTTP server listens on a configurable port (default 3000) via the `PORT` environment variable. In production, the container orchestrator maps this to the appropriate external port.

### D26. Dependency Container Contents

The dependency container passed to each module's setup function contains: logger (child logger scoped to the module name), event bus, session provider, i18n instance, settings service, and the module's own validated config. This is a plain object, not a DI framework.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST initialize all subsystems in a defined order at startup: static settings → super admin bootstrap → cache warming → module discovery → module validation → module handler loading → command registration → HTTP server start.
- **FR-002**: System MUST trigger the module-registry discovery and validation pipeline at startup and halt if any core module fails validation.
- **FR-003**: System MUST dynamically import each validated module's entry point and call its setup function, passing the bot instance and dependency container.
- **FR-004**: System MUST halt if a core module's handler loading fails, and log a warning and continue if a non-core module's handler loading fails.
- **FR-005**: System MUST apply the security middleware chain in the fixed order: input sanitization → rate limiting → authentication/authorization → input validation → business logic → audit logging.
- **FR-006**: System MUST support dual operation modes: polling for development and webhook for production, configurable via environment variable, with no hot-switching.
- **FR-007**: System MUST provide a webhook endpoint that verifies incoming requests using the `X-Telegram-Bot-Api-Secret-Token` header.
- **FR-008**: System MUST provide a health check endpoint that reports the status of all subsystems (database, cache, queue, AI provider, disk) with latency measurements and an overall classification (healthy/degraded/unhealthy).
- **FR-009**: System MUST implement a graceful shutdown sequence on SIGTERM/SIGINT with ordered resource cleanup and a 30-second total timeout.
- **FR-010**: System MUST bootstrap super admin users from SUPER_ADMIN_IDS environment variable before module registration.
- **FR-011**: System MUST warm caches at startup in order: system settings first, then translation strings.
- **FR-012**: System MUST implement a global error boundary that generates a unique error reference code (ERR-YYYYMMDD-XXXX), logs the full error, optionally reports to monitoring, and returns a localized user-facing message.
- **FR-013**: System MUST emit lifecycle events: system.startup.completed, system.shutdown.initiated, system.shutdown.completed, system.error.
- **FR-014**: System MUST enforce maintenance mode by intercepting all updates and replying with a localized message when enabled, allowing only SUPER_ADMIN users to bypass.
- **FR-015**: System MUST enforce scoped user restrictions per module — only Telegram user IDs in the module's scopedUsers list can access that module's commands.
- **FR-016**: System MUST register all validated modules' commands with the Telegram API after handler loading completes.

### Non-Functional Requirements

- **NFR-001**: Application startup MUST complete within 30 seconds under normal conditions (excluding network latency to external services).
- **NFR-002**: Graceful shutdown MUST complete within 30 seconds or force-exit with a fatal log.
- **NFR-003**: Health check endpoint MUST respond within 5 seconds even when subsystems are unresponsive.
- **NFR-004**: The application MUST NOT export any public API — it is a standalone entry point only.
- **NFR-005**: All user-facing text MUST be localized via the i18n system (no hardcoded strings).

### Key Entities

- **StartupSequence**: The ordered list of initialization steps that bring the application from process start to accepting traffic.
- **MiddlewareChain**: The fixed-order pipeline of security and processing middleware applied to every incoming bot update.
- **OperationMode**: The runtime mode of the bot — polling (development) or webhook (production).
- **HealthCheckResult**: The aggregated health status of all subsystems with individual check results and overall classification.
- **ErrorReference**: A unique code (ERR-YYYYMMDD-XXXX) that links a user-facing error message to its log entry and monitoring event.
- **ShutdownSequence**: The ordered list of cleanup steps that bring the application from running to terminated, with per-step timeouts.
- **DependencyContainer**: The collection of shared dependencies (logger, event bus, session provider, i18n, settings) passed to each module's setup function.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Application starts successfully with all valid modules discovered, validated, loaded, and commands registered (FR-001, FR-002, FR-003, FR-016).
- **SC-002**: Application halts if a core module fails validation or handler loading (FR-002, FR-004).
- **SC-003**: Application continues with a warning if a non-core module fails validation or handler loading (FR-002, FR-004).
- **SC-004**: Security middleware chain executes in the exact fixed order for every incoming update (FR-005).
- **SC-005**: Polling mode connects via long polling without webhook route; webhook mode starts HTTP server with verified webhook endpoint (FR-006, FR-007).
- **SC-006**: Health check returns correct overall classification based on subsystem status (FR-008).
- **SC-007**: Graceful shutdown completes in order within 30 seconds or force-exits (FR-009, NFR-002).
- **SC-008**: Super admin users are bootstrapped before module registration (FR-010).
- **SC-009**: Caches are warmed in order: settings first, translations second (FR-011).
- **SC-010**: Global error boundary produces ERR-YYYYMMDD-XXXX reference codes in user-facing messages and logs (FR-012).
- **SC-011**: Lifecycle events are emitted at startup, shutdown, and on error (FR-013).
- **SC-012**: Maintenance mode blocks non-admin users and allows SUPER_ADMIN through (FR-014).
- **SC-013**: Scoped user enforcement blocks unlisted users from accessing restricted modules (FR-015).
- **SC-014**: Application startup completes within 30 seconds under normal conditions (NFR-001).
- **SC-015**: All user-facing text is localized — zero hardcoded strings (NFR-005).
