---
"@tempot/ai-core": minor
---

feat(ai-core): add Phase 2 LLM-friendly patterns

New utilities for LLM tool integration:
- Pagination: generic `paginate<T>()` with `PaginatedResult` and `PaginationOptions` types
- Extension groups: `getByGroup()`, `getByGroups()`, `getGroups()` on ToolRegistry with pagination overloads
- Output size limiting: `truncateToolOutput()` with configurable maxOutputChars and IntentRouter integration
- Input normalization: 6 Zod preprocessors (`coerceNumber`, `coerceInteger`, `coerceBoolean`, `normalizeString`, `flexibleDate`, `normalizeArray`) for handling LLM-sent values
- Batch tool executor: `executeBatch()` with sequential execution, partial failure support, and `BatchResult` summary
