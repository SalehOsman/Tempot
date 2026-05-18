# 7. تحليل الأمن — Security Review

## نتائج Security Audit

```
pnpm audit --audit-level=high → 4 vulnerabilities
- 2 moderate (esbuild, @hono/node-server)
- 1 high (devalue)
- 1 critical (sanitize-html)
```

## جدول الثغرات والمخاطر

| الثغرة/الخطر | الخطورة | الدليل | التأثير | طريقة المعالجة |
|---|---|---|---|---|
| `sanitize-html ≤2.17.3` vulnerability | Critical | `pnpm audit` — used in bot-server sanitizer middleware | Potential XSS bypass in message sanitization | تحديث إلى ≥2.17.4 |
| WEBHOOK_SECRET env mismatch | Critical | `config.loader.ts:41` reads `WEBHOOK_SECRET` vs `.env.example` defines `WEBHOOK_SECRET_TOKEN` | Webhook mode fails → bot offline OR webhook unprotected | توحيد اسم المتغير |
| `devalue` vulnerability | High | Via astro in docs app only | Potential prototype pollution — docs app فقط (لا يؤثر على bot-server) | تحديث astro |
| SUPER_ADMIN_IDS hardcoded | Medium | `docker-compose.yml:36` — `SUPER_ADMIN_IDS=7594239391` | Information disclosure (Telegram user ID مكشوف في Git) | نقل إلى `${SUPER_ADMIN_IDS:-}` |
| PostgreSQL password في docker-compose | Low | `docker-compose.yml:67` — `tempot_password` | Dev-only — مقبول مع توثيق | إضافة تعليق "dev only, override in production" |
| Rate Limiter in-memory | Low | `rate-limiter.middleware.ts:48` | Bypass عند multi-instance | مقبول لـ single-instance حالياً |
| `esbuild ≤0.24.2` | Low | Dev dependency via drizzle-kit | لا يؤثر على production | تحديث عند التوفر |

## تحليل تفصيلي

### Input Validation & Sanitization

**الحالة: ✅ مطبق**

```typescript
// bot/middleware/sanitizer.middleware.ts
const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [],      // ← يزيل كل HTML tags
  allowedAttributes: {},
};

// يطبق على msg.text و msg.caption
```

**الملاحظة:** الـ sanitizer يزيل **كل** HTML tags — defense-in-depth ممتاز. المشكلة الوحيدة: `sanitize-html` نفسها بها ثغرة تحتاج تحديث.

### Authentication & Authorization

**الحالة: ✅ مطبق**

```typescript
// packages/auth-core/src/guards/auth.guard.ts
export class Guard {
  static enforce(ability: AnyAbility, action: AppAction, subject: AppSubject): Result<void, AppError> {
    if (ability.can(action, subject)) return ok(undefined);
    return err(new AppError('auth.forbidden', { action, subject }));
  }
}

// packages/auth-core/src/factory/ability.factory.ts
export class AbilityFactory {
  static build(user: SessionUser, definitions: AbilityDefinition[]): Result<AnyAbility, AppError> {
    const rules = definitions.flatMap((def) => def(user).rules);
    return ok(createMongoAbility(rules));
  }
}
```

**الملاحظة:** CASL-based authorization مع Result pattern. Toggle support للتعطيل أثناء التطوير.

### Rate Limiting

**الحالة: ✅ مطبق**

```typescript
// bot/middleware/rate-limiter.middleware.ts
const SCOPE_CONFIGS: Record<UpdateScope, ScopeConfig> = {
  command: { points: 10, duration: 60 },   // 10 commands/min
  upload: { points: 5, duration: 600 },    // 5 uploads/10min
  message: { points: 30, duration: 60 },   // 30 messages/min
};
```

### Secrets Management

| العنصر | الحالة | الملاحظة |
|---|---|---|
| `.env` في `.gitignore` | ✅ محمي | لا يمكن قراءته من Git |
| `.env.example` بدون secrets | ✅ آمن | Placeholders فقط |
| Bot token | ✅ آمن | يُقرأ من env فقط + يُفحص في startup |
| Token storage in DB | ⚠️ مقبول | `tokenRedacted` (أول/آخر 4 أحرف) + `tokenFingerprint` (hash) |
| Sentry DSN | ✅ آمن | اختياري — يُقرأ من env |

### Error Boundary — لا يسرب بيانات حساسة

```typescript
// bot/error-boundary.ts:74-76
const message = deps.t('bot-server.error_message', { referenceCode });
await err.ctx.reply(message);
// ← المستخدم يرى reference code فقط — لا يرى stack trace أو تفاصيل الخطأ
```

## ملخص الأمن

- **نقاط القوة:** Sanitization شامل، Rate limiting مطبق، Auth/Guard pattern، secrets محمية، error messages آمنة
- **نقاط الضعف:** ثغرة في sanitize-html dependency، env var mismatch، SUPER_ADMIN_ID مكشوف
- **التقييم:** أغلب الممارسات الأمنية مطبقة — المشاكل الموجودة محدودة وقابلة للإصلاح سريعاً
