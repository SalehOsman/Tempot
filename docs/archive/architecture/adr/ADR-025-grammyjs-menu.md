# ADR-025: @grammyjs/menu for Search Engine Display Layer

**Date:** 2026-03-19
**Status:** Accepted

## Context

The search-engine package needs to render paginated, searchable lists with inline keyboard navigation. v10 built a custom renderer that managed keyboard state, button construction, and edit-message logic manually.

## Decision

Use **@grammyjs/menu** (official grammY plugin) as the display layer for search-engine.

## Consequences

- Official plugin maintained by the grammY team — guaranteed compatibility with grammY updates
- Menu state management handled by the library — no manual `ctx.editMessageText` orchestration
- Dynamic menus supported — list items can be generated at render time from the dataProvider
- Keyboard layout (rows, columns, pagination buttons) defined declaratively
- Edit-message rule (Constitution Rule LXIV) is enforced automatically by the plugin

## Alternatives Rejected

**Custom renderer (v10 approach):** Manual `editMessageText`, manual button array construction, manual page state tracking in cache-manager. 400+ lines of boilerplate. Every search UI inconsistently implemented.

**grammY inline keyboards directly:** Lower-level than @grammyjs/menu. Same manual state management problem. No declarative layout.
