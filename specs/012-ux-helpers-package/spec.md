# Feature Specification: UX Helpers (Standardized UI)

**Feature Branch**: `012-ux-helpers-package`  
**Created**: 2026-03-19  
**Status**: Draft  
**Input**: User description: "Establish the functional ux-helpers package for standardized messages, buttons, and UI components as per Tempot v11 Blueprint."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consistent Visual Feedback (Priority: P1)

As a user, I want the bot to use consistent symbols and colors for success, error, and loading states so that I can understand the bot's status at a glance.

**Why this priority**: Core UX requirement (Section 13) to ensure a polished and professional interface.

**Independent Test**: Verified by triggering various states and confirming the emoji and formatting match the "Status Message Types" (Rule LXV).

**Acceptance Scenarios**:

1. **Given** a successful operation, **When** the bot responds, **Then** it uses the `✅ Success` pattern with the correct i18n message.
2. **Given** a background task, **When** it starts, **Then** the bot uses the `⏳ Loading` pattern and updates the same message when finished (Rule LXIV).

---

### User Story 2 - Unified Keyboard Builder (Priority: P1)

As a developer, I want a standardized way to build Inline and Reply keyboards that follow the framework's layout rules so that my bot remains visually balanced.

**Why this priority**: Ensures all modules follow the "Button Standards" (Rule LXVI) automatically.

**Independent Test**: Creating a keyboard with 5 buttons and verifying it is correctly paginated or wrapped according to the "3 buttons per row" rule.

**Acceptance Scenarios**:

1. **Given** a list of 4 long labels, **When** I build an Inline keyboard, **Then** the helper automatically places them in single rows to avoid truncation.
2. **Given** a confirmation request, **When** the helper builds the buttons, **Then** "Confirm" and "Cancel" are placed side-by-side in the same row.

---

## Edge Cases

- **Text Truncation**: Buttons with very long labels (Answer: Helper MUST enforce max 20 chars for Arabic or wrap to a single row).
- **RTL Alignment**: Ensuring buttons and symbols appear correctly for Arabic users (Answer: Mandatory use of RTL-compatible emojis and alignment).
- **Double Click**: Preventing users from pressing the same button twice (Answer: Handlers must use the `loading` state to disable buttons during processing).

## Clarifications

- **Technical Constraints**: @grammyjs/menu integration (ADR-025). Standardized status types.
- **Constitution Rules**: Rule LXIV (Message Update/Golden Rule). Rule LXVI (Button Standards: max 20-24 chars, 3/row). Rule LXVIII (List Display).
- **Integration Points**: Used by all bot-facing modules and engines (`input-engine`, `search-engine`).
- **Edge Cases**: Long labels are automatically wrapped or placed in single rows. RTL-compatible emojis are mandatory. Handlers must use the `loading` state to disable buttons during processing.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide helpers for the 4 status types: `Loading`, `Success`, `Error`, `Warning`.
- **FR-002**: System MUST enforce the "Message Update Rule" (Golden Rule LXIV) by default.
- **FR-003**: System MUST implement a `KeyboardBuilder` that enforces layout rules (Rule LXVI).
- **FR-004**: System MUST automatically add emojis to the start of button labels for better readability.
- **FR-005**: System MUST provide a `PaginationHelper` for simple lists.
- **FR-006**: System MUST provide a `ConfirmationHelper` with automatic 5-minute expiry logic.
- **FR-007**: System MUST ensure all UI components are fully compatible with i18n interpolation.

### Key Entities

- **UIComponent**: Abstract definition of a reusable message or keyboard pattern.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of bot messages follow the standardized status patterns.
- **SC-002**: 100% of keyboards follow the row/character count limits automatically.
- **SC-003**: Developers can build a complex paginated menu in < 20 lines of code using helpers.
- **SC-004**: System successfully handles RTL layout for 100% of user-facing components.
