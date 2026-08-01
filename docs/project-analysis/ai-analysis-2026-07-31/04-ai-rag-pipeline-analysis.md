# 4. RAG Pipeline & Data Processing Analysis

## 4.1 Ingestion Pipeline Architecture

The Tempot AI RAG ingestion pipeline is structured to ensure high-quality vector representations, robust data hygiene, and context-aware metadata extraction. 

### 4.1.1 Chunking & Profiling
The ingestion process relies on intelligent chunking and path profiling to maintain context continuity.
- **Path Profiling:** The pipeline utilizes `markdown-path-profile.ts` to attach context-heavy metadata. Specifically, it assigns profiles like `localized-product` to product index paths, enabling targeted downstream retrieval.
- **Chunking Strategy:** Content is chunked preserving semantic boundaries (e.g., Markdown headings and paragraphs) rather than arbitrary token counts, ensuring that concepts remain intact.

### 4.1.2 Data Hygiene & Sanitization
Security and privacy are prioritized before any data reaches the vector store.
- **PII Sanitization:** In `content-ingestion.service.ts`, rigorous PII sanitization regex patterns strip sensitive personal information before chunking and embedding.
- **Validation:** Strict schema validation ensures that all incoming documents match the expected structure, preventing malformed data from corrupting the index. 
- *Note:* The term "leakage" in this system strictly refers to data security and cross-tenant boundary concerns. 

## 4.2 Retrieval Architecture

The retrieval phase utilizes a plan-based architecture to intelligently route queries and assemble context.

### 4.2.1 Retrieval Plan Architecture & Access Matrix
Query resolution is governed by a structured access matrix that queries distinct indexes based on intent classification. The matrix includes:
- `ui-guide`
- `bot-functions`
- `db-schema`
- `developer-docs`
- `custom-knowledge`
- `user-memory`

This segregation ensures that the AI model receives only the most relevant, highly-focused context for a given prompt, reducing hallucinations and improving response accuracy.

### 4.2.2 Advanced Filtering and Reranking
Once initial retrieval is complete, advanced filtering refines the candidate set.
- **Language-Aware Filtering:** The system utilizes `help-ai-context-quality.ts` incorporating `preferredLanguageSources()` to prioritize documents matching the user's localized preferences.
- **Reranking:** A secondary reranking step evaluates the retrieved chunks against the original query semantics, promoting the most relevant chunks to the top of the context window.

## 4.3 Conclusion & Recommendations

The RAG pipeline effectively balances context density with data privacy.
- **Strength:** The robust access matrix and language-aware filtering ensure high precision.
- **Recommendation:** Continue refining the PII sanitization regex to adapt to emerging privacy standards without over-redacting valid technical context.
