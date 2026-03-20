# Security Operations

> Reference: Spec v11, Section 20 — SECURITY.md

---

## Secret Management

### What Counts as a Secret

| Secret | Storage | Rotation |
|--------|---------|----------|
| `BOT_TOKEN` | `.env` only | On suspected compromise |
| `DATABASE_URL` | `.env` only | Quarterly |
| `REDIS_URL` | `.env` only | Quarterly |
| `SUPER_ADMIN_IDS` | `.env` only | When team changes |
| AI API keys | `.env` + encrypted in DB | On suspected compromise |
| Webhook secret token | `.env` only | Quarterly |
| Storage credentials | `.env` only | Quarterly |

### Secret Rotation Procedure

```bash
# 1. Generate new secret (example: webhook token)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 2. Update .env
WEBHOOK_SECRET_TOKEN=new-value-here

# 3. Update the external service (e.g., Telegram webhook)
pnpm webhook:set

# 4. Restart bot to apply new secret
docker compose restart bot-server

# 5. Verify functionality
curl https://your-domain.com/health
```

### Never Store Secrets In

- Source code (any file tracked by git)
- Log files
- Audit Log entries (PII redaction in Pino `beforeSend`)
- Error messages sent to users
- GitHub Issues or Pull Request descriptions

---

## Key Rotation Schedule

| Secret | Frequency | Trigger |
|--------|-----------|---------|
| Database password | Every 90 days | Calendar reminder |
| Redis password | Every 90 days | Calendar reminder |
| AI API keys | On suspected compromise | Sentry alert |
| Storage credentials | Every 180 days | Calendar reminder |
| Webhook secret | Every 90 days | Calendar reminder |

---

## gitleaks Configuration

gitleaks scans every commit for accidentally committed secrets. Configuration at `.gitleaks.toml`:

```toml
[extend]
useDefault = true

[[rules]]
id = "telegram-bot-token"
description = "Telegram Bot Token"
regex = '''\d{8,10}:[a-zA-Z0-9_-]{35}'''
tags = ["telegram", "bot"]

[[rules]]
id = "gemini-api-key"
description = "Google AI API Key"
regex = '''AIza[0-9A-Za-z_-]{35}'''
tags = ["google", "ai"]
```

If gitleaks finds a secret:

```bash
# 1. Immediately revoke the exposed secret at the provider
# 2. Generate a new secret and update .env
# 3. Force-push to remove the commit (coordinate with team)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all
# 4. Notify affected users if the secret provided data access
```

---

## Penetration Testing

### Scope

Annual penetration test covering:

- Telegram webhook endpoint (authentication bypass attempts)
- Hono API endpoints (authentication, authorisation, injection)
- Dashboard (XSS, CSRF, session hijacking)
- Role escalation attempts (GUEST → USER → ADMIN → SUPER_ADMIN)

### Pre-test Checklist

- [ ] Test environment only (never production)
- [ ] Backup taken before testing
- [ ] Rate limiters configured as in production
- [ ] gitleaks running
- [ ] Sentry enabled and monitoring

### Common Attack Vectors to Test

```bash
# 1. Webhook replay attack (send same update twice)
# Expected: Telegram update_id deduplication prevents double-processing

# 2. Invalid webhook secret
curl -X POST https://your-domain.com/webhook \
  -H "X-Telegram-Bot-Api-Secret-Token: wrong-secret" \
  -d '{}'
# Expected: 403 Forbidden

# 3. Role escalation via direct API call
curl -X POST https://your-domain.com/api/users/me/role \
  -H "Authorization: Bearer user-token" \
  -d '{"role": "SUPER_ADMIN"}'
# Expected: 403 Forbidden (CASL prevents this)

# 4. SQL injection in search
curl https://your-domain.com/api/invoices?search="'; DROP TABLE invoices; --"
# Expected: No SQL execution (Prisma parameterises queries)
```

---

## Incident Response

### Severity Levels

| Level | Definition | Response Time |
|-------|-----------|---------------|
| P0 | Data breach or full system compromise | Immediate (< 15 min) |
| P1 | Bot completely unavailable | < 1 hour |
| P2 | Feature unavailable (AI, storage, etc.) | < 4 hours |
| P3 | Minor degradation | < 24 hours |

### P0 Response Checklist

```
□ Assess scope — what data was accessed?
□ Isolate affected system (take bot offline if necessary)
□ Revoke all affected secrets immediately
□ Preserve logs for forensic analysis
□ Notify affected users if personal data was exposed
□ Root cause analysis
□ Fix and deploy
□ Post-mortem documentation
□ Update Risk Registry
```

---

## Audit Log Review

Weekly review of critical Audit Log events:

```sql
-- Role changes in the past week
SELECT * FROM audit_logs
WHERE action = 'users.user.role_changed'
AND timestamp > NOW() - INTERVAL '7 days'
ORDER BY timestamp DESC;

-- Repeated denied access
SELECT "userId", COUNT(*) as attempts
FROM audit_logs
WHERE status = 'DENIED'
AND timestamp > NOW() - INTERVAL '24 hours'
GROUP BY "userId"
HAVING COUNT(*) > 10
ORDER BY attempts DESC;

-- Bulk deletions
SELECT * FROM audit_logs
WHERE action LIKE '%.bulk_delete'
AND timestamp > NOW() - INTERVAL '7 days';
```

---

## SUPER_ADMIN Security

SUPER_ADMIN accounts are the highest-value targets. Additional protections:

1. **Minimal SUPER_ADMIN count** — only the essential minimum (1–2 people)
2. **Telegram account security** — enable Two-Step Verification on the Telegram account linked to SUPER_ADMIN_IDS
3. **Never share SUPER_ADMIN_IDS** — each SUPER_ADMIN has their own Telegram ID in the list
4. **Monitor SUPER_ADMIN actions** — all actions are logged; review weekly
5. **Revoke promptly** — remove from SUPER_ADMIN_IDS immediately when someone leaves the team
