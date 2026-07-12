# Data Model: AI/RAG Vector Storage Activation

## Embeddings Table

Physical table: `embeddings`

| Column | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `uuid` | Yes | Primary key with database-generated default. |
| `content_id` | `text` | Yes | Stable source content id. |
| `content_type` | `text` | Yes | RAG content discriminator. |
| `vector` | `vector(3072)` | Yes | Gemini embedding vector. |
| `metadata` | `jsonb` | No | Source metadata, access metadata, and chunk metadata. |

## Index

Physical index: `embeddings_vector_hnsw_idx`

The index uses HNSW over the expression:

```sql
(vector::halfvec(3072)) halfvec_cosine_ops
```

## Ownership

Drizzle remains the source owner for the pgvector table definition. The
committed SQL migration is operational evidence that the physical database can
be prepared consistently.
