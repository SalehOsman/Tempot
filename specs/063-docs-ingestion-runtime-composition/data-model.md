# Data Model: Documentation Ingestion Runtime Composition

## IngestionRun

Represents one execution of the docs ingestion CLI.

| Field | Type | Notes |
| --- | --- | --- |
| `mode` | `'dry-run' \| 'write'` | Dry-run never writes hashes or embeddings. |
| `full` | `boolean` | Forces processing even when hashes match. |
| `processed` | `number` | Files that were previewed or ingested. |
| `skipped` | `number` | Files skipped because hashes were unchanged. |
| `failed` | `number` | Files with file-level failures. |
| `hashesWritten` | `boolean` | True only when write mode persisted the cache. |

## DocumentationFile

Represents a discovered Markdown file under `docs/product`.

| Field | Type | Notes |
| --- | --- | --- |
| `filePath` | `string` | Path relative to `docs/product`. |
| `contentHash` | `string` | SHA-256 of file content. |
| `language` | `'ar' \| 'en' \| 'unknown'` | Derived from the first path segment. |
| `contentType` | `'developer-docs'` | Current indexed content type. |
| `chunkCount` | `number` | Markdown chunks produced for preview or ingestion. |
| `packageName` | `string \| null` | Optional frontmatter package. |

## IngestionFailure

Represents a structured file-level failure.

| Field | Type | Notes |
| --- | --- | --- |
| `filePath` | `string` | Failed documentation file. |
| `code` | `string` | `AppError.code`. |
| `details` | `unknown` | Error details safe for operator logs. |

## HashCache

Represents `.docs-hashes.json`.

| Field | Type | Notes |
| --- | --- | --- |
| `filePath` | `string` | Documentation file path. |
| `contentHash` | `string` | Hash of successfully indexed content. |

## State Transitions

1. Discovered file has a hash.
2. If hash matches and `--full` is not set, file becomes skipped.
3. In dry-run, changed file becomes previewed only.
4. In write mode, changed file becomes indexed only after ingestion succeeds.
5. Only indexed files update the hash cache.
6. Failed files remain absent from updated hash entries so the next incremental
   run retries them.
