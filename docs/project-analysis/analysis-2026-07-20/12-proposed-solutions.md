# 11 - Proposed Solutions

This document details Technical Solutions for the primary findings identified in the Tempot repository audit, defining Quick Fixes, Long-term Fixes, and verification strategies.

---

## 1. Issue: Incomplete Staging Operational Evidence (P0)

* **Quick Fix:** Deploy the current Docker image candidate (`ghcr.io/salehosman/tempot-bot-server@sha256:...`) to a local virtual machine simulating staging, run the local bot server via Cloudflare Quick Tunnel, and capture `/live` and `/ready` response logs.
* **Long-term Fix:** Integrate automated staging deployment into the Github Actions pipeline, triggering on version tag releases. The deployment must execute migrations, check health endpoints, run a suite of integration test cases, and automatically roll back on failure.
* **Impact:** Satisfies Spec #057 and provides verifiable operational readiness evidence.
* **Affected Files:** `docs/ROADMAP.md`, `.github/workflows/docker.yml`, `docs/operations/evidence/`.
* **Application Risks:** High risk of regression if migrations are applied to production databases without staging verification.
* **How to Verify Success:** A dated markdown document in `docs/operations/evidence/` showing logs of a successful database migration, webhook start, message processing, and restoration of a backup.

---

## 2. Issue: Insecure Request Body Memory Buffering (P2)

* **Quick Fix:** Import Hono's standard `bodyLimit` middleware in the Hono factory and restrict incoming webhook payload size to 10MB.
* **Long-term Fix:** Enforce body size limits at the reverse proxy (e.g., Cloudflare Tunnel, Nginx, or AWS ALB configuration) so that oversized requests are rejected at the edge, before reaching the Node.js runtime process.
* **Impact:** Fully protects the Hono bot server from OOM (Out of Memory) DoS attacks.
* **Affected Files:** [hono.factory.ts](file:///f:/Tempot/apps/bot-server/src/server/hono.factory.ts).
* **Application Risks:** Low risk. Webhook update payloads from Telegram are generally under 50KB. A 10MB limit will not affect legitimate Telegram traffic.
* **How to Verify Success:** Send a POST request with a 15MB file payload using `curl` or Postman, and verify the server immediately responds with `413 Payload Too Large` without loading the body.

---

## 3. Issue: Rate Limit Client IP Spoofing (P2)

* **Quick Fix:** In Hono's rate-limiting setup, extract client IP only from trusted headers (like `CF-Connecting-IP` if using Cloudflare, or standard `X-Forwarded-For`).
* **Long-term Fix:** Enforce rate-limiting at the proxy level (e.g., Cloudflare Web Application Firewall). The Node.js application should only validate that the request originated from the proxy's IP range, rejecting requests that bypass the proxy.
* **Impact:** Mitigates the risk of a single attacker exhausting server resources or causing a collision where multiple users are incorrectly grouped under `'unknown-client'`.
* **Affected Files:** [hono.factory.ts](file:///f:/Tempot/apps/bot-server/src/server/hono.factory.ts).
* **Application Risks:** Low risk, but proxy configuration must be aligned; otherwise, legitimate requests might be blocked if IP extraction fails.
* **How to Verify Success:** Write a unit test simulating requests with spoofed headers and verify the rate-limiter maps client identity correctly.

---

## 4. Issue: Indexing Stale Project Analysis Docs into RAG (P2)

* **Quick Fix:** Modify the docs discovery script to ignore any file path starting with `docs/project-analysis/` or containing `docs/archive/`.
* **Long-term Fix:** Integrate a RAG configuration manifest (`docs/rag/manifest.json`). The ingestion crawler should parse this manifest to retrieve indexing scopes, language settings, and freshness priorities, rather than crawling the filesystem indiscriminately.
* **Impact:** Drastically improves AI RAG search precision by ensuring only active guides and specs are used as context.
* **Affected Files:** [doc-discovery.ts](file:///f:/Tempot/apps/docs/scripts/doc-discovery.ts), [ingest-docs.ts](file:///f:/Tempot/apps/docs/scripts/ingest-docs.ts).
* **Application Risks:** Low risk. No production features are impacted.
* **How to Verify Success:** Run `pnpm docs:ingest --dry-run` and verify that no files under `docs/project-analysis/` are parsed or logged.
