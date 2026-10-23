# 🚨 Tembot Architectural Incident Catalog

> Canonical repository of architectural defects, operational anomalies, and forensic post-mortems for the Tembot Platform.

---

## 🏛️ Incident Governance Policy

Every architectural defect, runtime regression, or unexpected operational failure must be documented as an immutable Incident Record (`INC-YYYYMMDD-XX-<TITLE>.md`) under this directory.

### Mandatory Structure of an Incident Record:
1. **Header Metadata:** Incident ID, Date, Severity, Impacted Surfaces, Status.
2. **Executive Summary:** Plain-language summary of what happened.
3. **Forensic Timeline:** Exact sequence of events leading to detection.
4. **Root Cause Analysis (5 Whys):** Deep mechanical diagnosis of the failure mechanism.
5. **Remediation & Permanent Sentinel Gate:** Concrete tests, tools, or invariants added to guarantee non-recurrence.

---

## 📋 Incident Ledger

| Incident ID | Date | Severity | Impacted Surfaces | Summary & Status |
| :--- | :--- | :--- | :--- | :--- |
| [`INC-20261023-01`](./INC-20261023-01-DATABASE-MIGRATION-DRIFT.md) | 2026-10-23 | HIGH | Database, Kernel Modules | PostgreSQL running without applied migrations; silent fallback to memory. *(RESOLVING)* |
| [`INC-20261023-02`](./INC-20261023-02-PER-USER-LOCALE-ISOLATION.md) | 2026-10-23 | MEDIUM | Telegram Bot, System Settings | Language switcher mutates tenant-level default rather than per-user preference. *(RESOLVING)* |
| [`INC-20261023-03`](./INC-20261023-03-TMA-SERVER-AUTH-BRIDGE.md) | 2026-10-23 | MEDIUM | TMA, Server API, Access Control | Telegram Mini App unlinked from backend HMAC cryptographic validation. *(RESOLVING)* |
| [`INC-20261023-04`](./INC-20261023-04-DASHBOARD-OPERATOR-AUTH.md) | 2026-10-23 | HIGH | Admin Dashboard, Access Control | Admin dashboard missing operator login gate and bearer token headers. *(RESOLVING)* |
| [`INC-20261023-05`](./INC-20261023-05-PRODUCTION-DOCKER-TOPOLOGY.md) | 2026-10-23 | LOW | DevOps, Deployment Topologies | Docker compose missing application containers for production deployment. *(RESOLVING)* |
