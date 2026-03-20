# AI Re-indexing Strategy

> Reference: Spec v11, Section 17.1.1 — ADR-017

---

## When Re-indexing is Required

Re-indexing all vector embeddings is required when:

1. **Changing `AI_PROVIDER`** — Embeddings from different providers use incompatible vector spaces
2. **Changing `AI_EMBEDDING_MODEL`** — Even within the same provider, different models produce incompatible vectors
3. **Changing `AI_EMBEDDING_DIMENSIONS`** — Different dimension counts are incompatible

> ⚠️ **Critical:** Never mix embeddings from different models in the same pgvector table. Cosine similarity between incompatible vectors produces meaningless results.

---

## Zero-Downtime Re-indexing Strategy

### Phase 1 — Preparation

```bash
# 1. Set new provider/model in .env (do NOT restart yet)
AI_PROVIDER_NEW=openai
AI_EMBEDDING_MODEL_NEW=text-embedding-3-large
AI_EMBEDDING_DIMENSIONS_NEW=1536

# 2. Create a shadow embeddings table
pnpm db:migrate --name add_embeddings_shadow
```

The shadow table (`embeddings_shadow`) mirrors the schema of `embeddings` but is empty.

### Phase 2 — Dual Index (live traffic on old, building new)

```bash
# Start background indexer — writes to embeddings_shadow
# Does NOT affect embeddings (old table still serving traffic)
pnpm ai:reindex --table shadow --batch-size 100 --delay 500ms
```

Monitor progress:

```bash
pnpm ai:reindex --status
# Output: 12,450 / 45,200 documents indexed (27%)
```

### Phase 3 — Validation

Before switching traffic, validate the new index:

```bash
pnpm ai:reindex --validate --sample 500
# Runs 500 test queries against both tables
# Reports: precision@10, recall@10, latency comparison
```

Minimum threshold before cutover: precision@10 ≥ 0.85

### Phase 4 — Atomic Cutover

```bash
# Atomic rename: embeddings → embeddings_old, embeddings_shadow → embeddings
pnpm ai:reindex --cutover

# Update .env
AI_PROVIDER=openai
AI_EMBEDDING_MODEL=text-embedding-3-large

# Restart bot
pnpm docker:restart bot-server
```

Traffic switches instantaneously. Old table retained for 48 hours.

### Phase 5 — Cleanup

```bash
# After 48 hours with no issues
pnpm ai:reindex --cleanup
# Drops embeddings_old table
```

---

## Rollback Procedure

If the new index produces worse results:

```bash
# Revert .env to old provider/model
# Rename tables back
pnpm ai:reindex --rollback

# Restart bot
pnpm docker:restart bot-server
```

Rollback is available until `--cleanup` is run.

---

## Batch Processing Configuration

Large datasets (100k+ documents) require careful batching to avoid:
- Rate limiting from the AI provider
- Memory pressure on the bot-server
- PostgreSQL connection pool exhaustion

| Parameter | Default | Notes |
|-----------|---------|-------|
| `--batch-size` | 100 | Documents per API call |
| `--delay` | 500ms | Delay between batches |
| `--concurrency` | 3 | Parallel batch workers |
| `--retry` | 3 | Retries per failed document |

For Gemini Embedding API: max 100 documents per request, 1500 requests/minute limit.

---

## HNSW Index Maintenance

After re-indexing, rebuild the HNSW index for optimal search performance:

```bash
pnpm db:index --rebuild embeddings
# Rebuilds HNSW index with ef_construction=200, m=16
# Estimated time: ~2 minutes per 100k vectors
```

Index parameters (set in Drizzle schema):

| Parameter | Value | Effect |
|-----------|-------|--------|
| `m` | 16 | Connections per layer — higher = better recall, more memory |
| `ef_construction` | 200 | Build-time search width — higher = better quality, slower build |
| `ef_search` | 100 | Query-time search width — set per-query |
