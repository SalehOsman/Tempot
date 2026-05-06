# Data Model: Search Engine Package

## SearchRequest

| Field | Type | Description |
| --- | --- | --- |
| `requestId` | string | Deterministic request identifier |
| `mode` | enum | `exact` or `semantic` |
| `query` | optional string | Text query |
| `filters` | SearchFilter list | Active filters |
| `sort` | SortRule list | Sort metadata |
| `pagination` | PaginationRequest | Page and page size |
| `allowedFields` | SearchFilterDefinition list | Fields accepted by the package |

## SearchFilter

| Field | Type | Description |
| --- | --- | --- |
| `field` | string | Field key configured by the caller |
| `kind` | enum | `enum`, `range`, `date-range`, `contains`, or `boolean` |
| `value` | discriminated value | Value shape for the filter kind |

## SearchPlan

| Field | Type | Description |
| --- | --- | --- |
| `mode` | enum | Relational or semantic execution path |
| `criteria` | structured object | Normalized criteria for repositories or adapters |
| `pagination` | PaginationPlan | Offset, limit, and page metadata |
| `messageKeys` | string list | i18n keys for empty or state messages |

## SearchStateSnapshot

| Field | Type | Description |
| --- | --- | --- |
| `stateId` | string | Cache key suffix |
| `ownerId` | string | User or session owner |
| `request` | SearchRequest | Request to restore |
| `expiresInSeconds` | number | TTL, fixed to 1800 seconds |

## SearchResultPage

| Field | Type | Description |
| --- | --- | --- |
| `items` | readonly list | Caller-provided result items |
| `totalItems` | number | Total matching records |
| `page` | number | Current page |
| `pageSize` | number | Requested page size |
| `messageKey` | optional string | Empty-state i18n key |
