# Feature Specification: Input Engine (Dynamic Forms)

**Feature Branch**: `011-input-engine-package`  
**Created**: 2026-03-19  
**Status**: Draft  
**Input**: User description: "Establish the functional input-engine package for dynamic multi-step conversations and form handling as per Tempot v11 Blueprint."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Dynamic Form Interaction (Priority: P1)

As a developer, I want to define a form schema using Zod and have the bot automatically handle the entire multi-step conversation so that I can collect data without writing boilerplate interaction logic.

**Why this priority**: Core framework capability (Section 7.3) that drastically reduces development time for complex bots.

**Independent Test**: Defining a 3-field schema and verifying the bot asks each question in order, validates input, and returns the final data object.

**Acceptance Scenarios**:

1. **Given** a `ShortText` and `Integer` schema, **When** I call `InputEngine.runForm()`, **Then** the bot asks for the text, waits for the response, then asks for the integer.
2. **Given** invalid input (e.g., text for an integer field), **When** the user responds, **Then** the bot displays an i18n error message and repeats the question.

---

### User Story 2 - Conditional & AI-Enhanced Fields (Priority: P2)

As a user, I want the bot to skip irrelevant questions or extract data from my voice messages so that my experience is fast and frictionless.

**Why this priority**: High-end UX feature (Section 7.3.8) that leverages the framework's AI and conditional logic.

**Independent Test**: Verifying a field is skipped based on a previous answer and using `AIExtractorField` to parse a test sentence.

**Acceptance Scenarios**:

1. **Given** a conditional field, **When** the prerequisite condition is not met, **Then** the engine automatically skips that field.
2. **Given** an `AIExtractorField`, **When** the user sends a message like "My name is Ali and I'm 25", **Then** the engine uses `ai-core` to extract both name and age correctly.

---

## Edge Cases

- **Conversation Timeout**: What if the user stops responding mid-form? (Answer: Default 10-minute timeout with automatic cancellation as per Section 7.3.6).
- **Session Reset**: Bot restarts while a user is on step 5 of 10 (Answer: `Partial Save` to Redis allows resuming where they left off).
- **User Cancellation**: The user types `/cancel` (Answer: Immediate termination of the form with `Result.err('cancelled')`).

## Clarifications

- **Technical Constraints**: `grammY Conversations` + `Zod`. 22 field types.
- **Constitution Rules**: Rule XXXIX (i18n-Only) for all prompts. Rule XXXIII (AI Degradation) for `AIExtractorField`. Rule XXXII (Partial Save) to Redis.
- **Integration Points**: Heavily uses `ux-helpers`, `session-manager`, and `ai-core`.
- **Edge Cases**: /cancel command and global timeouts are handled automatically. Bot restart recovery via `Partial Save`. AIExtractorField falls back to manual step-by-step input on AI failure.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST use `grammY Conversations` as the underlying interaction engine.
- **FR-002**: System MUST use `Zod` for schema definition and validation of all fields.
- **FR-003**: System MUST support 22 built-in field types (Text, Numeric, Choice, Geo, AI, etc.).
- **FR-004**: System MUST enforce the "i18n-Only Rule" for all prompts and error messages.
- **FR-005**: System MUST implement `Partial Save` (Rule XXXII) to Redis after every valid field entry.
- **FR-006**: System MUST provide automatic handling for `/cancel` and global timeouts.
- **FR-007**: System MUST implement `AIExtractorField` with fallback to manual input (AI Degradation Rule XXXIII).

### Key Entities

- **FormSchema**: A Zod-based configuration mapping fields to their types and i18n keys.
- **FormResult**: A type-safe object containing the validated data or a cancellation reason.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developer effort to build a 5-field form is reduced to defining a single schema object.
- **SC-002**: Validation response time (from user input to error/next prompt) must be < 100ms.
- **SC-003**: 100% of forms must support the `/cancel` command at any stage.
- **SC-004**: System successfully resumes 100% of partial sessions after a simulated bot restart (within TTL).
