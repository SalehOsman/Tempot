# License Audit

> Reference: Spec v11, Section 35

---

## Tempot License

Tempot is licensed under the **MIT License** — permissive, compatible with commercial use.

---

## Dependency License Audit

All production dependencies are audited for license compatibility with MIT.

### License Compatibility Matrix

| License        | Commercial Use | Distribution        | Modification | Compatible with MIT           |
| -------------- | -------------- | ------------------- | ------------ | ----------------------------- |
| MIT            | ✅             | ✅                  | ✅           | ✅                            |
| Apache 2.0     | ✅             | ✅                  | ✅           | ✅                            |
| BSD 2/3-Clause | ✅             | ✅                  | ✅           | ✅                            |
| ISC            | ✅             | ✅                  | ✅           | ✅                            |
| GPL v2/v3      | ✅             | ⚠️ Copyleft         | ✅           | ❌ Copyleft — cannot include  |
| AGPL           | ✅             | ⚠️ Copyleft         | ✅           | ❌ Copyleft — cannot include  |
| LGPL           | ✅             | ⚠️                  | ✅           | ⚠️ Acceptable if not modified |
| CC BY          | ✅             | ✅ with attribution | ✅           | ✅ for data/docs              |

---

## Production Dependency Licenses

| Package                 | Version | License    | Notes                                  |
| ----------------------- | ------- | ---------- | -------------------------------------- |
| grammy                  | 1.x     | MIT        | ✅ Used by: ux-helpers, storage-engine |
| @grammyjs/conversations | 1.x     | MIT        | ✅                                     |
| @grammyjs/ratelimiter   | 1.x     | MIT        | ✅                                     |
| @grammyjs/menu          | 1.x     | MIT        | ✅                                     |
| hono                    | 4.x     | MIT        | ✅                                     |
| prisma                  | 7.x     | Apache 2.0 | ✅                                     |
| @prisma/client          | 7.x     | Apache 2.0 | ✅                                     |
| drizzle-orm             | 0.45.x  | Apache 2.0 | ✅                                     |
| @casl/ability           | 6.x     | MIT        | ✅                                     |
| @casl/prisma            | 1.x     | MIT        | ✅                                     |
| neverthrow              | 8.x     | MIT        | ✅                                     |
| zod                     | 3.x     | MIT        | ✅                                     |
| sanitize-html           | 2.x     | MIT        | ✅                                     |
| rate-limiter-flexible   | 5.x     | ISC        | ✅                                     |
| pino                    | 9.x     | MIT        | ✅                                     |
| ioredis                 | 5.x     | MIT        | ✅                                     |
| cache-manager           | 6.x     | MIT        | ✅                                     |
| @keyv/redis             | 1.x     | MIT        | ✅                                     |
| @keyv/postgres          | 1.x     | MIT        | ✅                                     |
| bullmq                  | 5.x     | MIT        | ✅                                     |
| ai (Vercel AI SDK)      | 4.x     | Apache 2.0 | ✅                                     |
| @ai-sdk/google          | 1.x     | Apache 2.0 | ✅                                     |
| i18next                 | 25.x    | MIT        | ✅                                     |
| dayjs                   | 1.x     | MIT        | ✅                                     |
| bcrypt                  | 5.x     | MIT        | ✅                                     |
| ExcelJS                 | 4.x     | MIT        | ✅                                     |
| pdfmake                 | 0.2.x   | MIT        | ✅                                     |
| @googleapis/drive       | 8.x     | Apache 2.0 | ✅                                     |
| @aws-sdk/client-s3      | 3.x     | Apache 2.0 | ✅                                     |
| next                    | 14.x    | MIT        | ✅                                     |
| tailwindcss             | 3.x     | MIT        | ✅                                     |

### Dev Dependency Licenses

| Package    | License    | Notes       |
| ---------- | ---------- | ----------- |
| typescript | Apache 2.0 | ✅ dev only |
| vitest     | MIT        | ✅ dev only |
| vite       | MIT        | ✅ dev only |
| eslint     | MIT        | ✅ dev only |
| prettier   | MIT        | ✅ dev only |
| husky      | MIT        | ✅ dev only |
| tsx        | MIT        | ✅ dev only |

---

## Copyleft Check

**No GPL or AGPL dependencies found.** All production dependencies use permissive licenses (MIT, Apache 2.0, ISC, BSD).

---

## Data License

Geographic data from `countries-states-cities-database` is licensed under **MIT** — free to use commercially.

---

## How to Run the Audit

```bash
# Check all dependency licenses
pnpm dlx license-checker --production --summary

# Check for any GPL/AGPL licenses (should return empty)
pnpm dlx license-checker --production --excludePackages "" --failOn "GPL;AGPL"

# Generate full license report
pnpm dlx license-checker --production --out docs/legal/licenses-report.txt
```

---

## Attribution Requirements

Apache 2.0 licensed dependencies (Prisma, Drizzle, Vercel AI SDK, etc.) require attribution in distributed products. The `LICENSE` file at the repository root satisfies this requirement.

No action is required beyond maintaining the `LICENSE` file.
