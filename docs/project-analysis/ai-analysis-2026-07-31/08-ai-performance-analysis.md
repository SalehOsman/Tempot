# 08 AI Performance Analysis

## 8.1 Overview

This document provides an evidence-based performance analysis of the AI subsystems in the Tempot project. The analysis focuses on resource utilization, latency, and scalability bottlenecks, drawing upon the Tempot project analysis methodology from a Lead Performance Architect persona.

## 8.2 High-Impact Performance Issue: Excessive Per-Request Pool Creation / Connection Churn Risk

> [!IMPORTANT]
> **Priority:** P1 High

**Finding:**
The AI assistant and knowledge runtime modules currently instantiate a new database connection pool for every incoming request, which introduces significant overhead.

**Evidence:**
- Pool creation is observed per-request in `help-ai-assistant.provider.ts` and `knowledge-live-runtime.ts`.
- **Note on Resource Management:** It is explicitly documented that `pool.end()` *is* correctly called within `finally` blocks at [help-ai-assistant.provider.ts:63](file:///F:/Tempot/apps/bot-server/src/startup/help-ai-assistant.provider.ts#L63) and [knowledge-live-runtime.ts:77,123](file:///F:/Tempot/apps/bot-server/src/startup/knowledge-live-runtime.ts#L77-L123). 
- Therefore, there is **NO unmanaged memory or pool leak** occurring. The resources are correctly released.

**Impact of Connection Churn:**
While resources are cleaned up, the repeated creation and destruction of connection pools (connection churn) introduces several severe performance risks:
1. **TCP Socket Allocation Overhead:** Frequent opening and closing of TCP connections wastes CPU cycles and kernel network stack resources.
2. **Latency Spikes:** Connection handshakes (including SSL/TLS negotiation, if applicable) add significant, avoidable latency to every AI request.
3. **Connection Budget Pressure:** Under high concurrency, the application may temporarily exhaust connection limits or ephemeral ports while waiting for closed connections to exit the `TIME_WAIT` state, severely degrading throughput.

**Recommendation:**
Refactor the architecture to utilize a global, long-lived connection pool managed by the dependency injection container, or implement a singleton pool pattern.

## 8.3 Vector Indexing and Search Optimization

**Finding:**
Vector embeddings are utilizing high-dimensionality representations that can be optimized for storage and search performance.

**Evidence:**
- The embedding service is generating 3072-dimensional vectors. See [embedding.service.ts:104](file:///F:/Tempot/packages/ai-core/src/embedding/embedding.service.ts#L104).

**Optimization Strategy:**
To reduce memory footprint and accelerate nearest-neighbor searches, implement **halfvec** (16-bit floating point) storage combined with **HNSW** (Hierarchical Navigable Small World) indexing for the 3072-dim vectors. This will significantly improve query latency and reduce memory pressure on the vector database without meaningfully compromising recall accuracy.

## 8.4 Batch Processing Inefficiencies

**Finding:**
Text chunks are being embedded sequentially within loops, leading to sub-optimal throughput.

**Evidence:**
- Source code reviews indicate a sequential loop iterating over text chunks to generate embeddings one by one.

**Impact:**
Sequential API calls to the embedding model multiply network latency and prevent the utilization of vectorized batch processing capabilities offered by the embedding provider.

**Recommendation:**
Replace the sequential loop over chunks with a batch embedding approach. Utilize methods such as `embedMany` (or the equivalent batch API provided by the model SDK) to send multiple chunks in a single request. This will drastically reduce network round-trips and improve embedding throughput.
