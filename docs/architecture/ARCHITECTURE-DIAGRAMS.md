# Architecture Diagrams

> All diagrams use Mermaid syntax. Render in GitHub, VS Code (Mermaid extension), or [mermaid.live](https://mermaid.live).

---

## Diagram 1 — C4 Level 1: System Context

```mermaid
C4Context
  title Tempot — System Context

  Person(user, "Bot User", "Interacts via Telegram")
  Person(admin, "Admin", "Manages via Dashboard")
  Person(superadmin, "Super Admin", "Full system control")

  System(tempot, "Tempot", "Enterprise Telegram Bot Framework")

  System_Ext(telegram, "Telegram API", "Message delivery")
  System_Ext(ai, "AI Provider", "Gemini / OpenAI")
  System_Ext(storage, "Cloud Storage", "Google Drive / S3")
  System_Ext(sentry, "Sentry", "Error tracking")

  Rel(user, telegram, "Sends messages")
  Rel(telegram, tempot, "Webhooks / Polling")
  Rel(admin, tempot, "Dashboard HTTPS")
  Rel(superadmin, tempot, "Dashboard + Bot")
  Rel(tempot, telegram, "Sends replies")
  Rel(tempot, ai, "Embeddings + AI")
  Rel(tempot, storage, "File uploads")
  Rel(tempot, sentry, "Error reports")
```

---

## Diagram 2 — C4 Level 2: Container Diagram

```mermaid
C4Container
  title Tempot — Containers

  Person(user, "Bot User")
  Person(admin, "Admin")

  System_Boundary(tempot, "Tempot") {
    Container(bot, "bot-server", "Node.js / grammY + Hono", "Telegram bot + REST API")
    Container(dashboard, "dashboard", "Next.js", "Admin control panel")
    Container(miniapp, "mini-app", "Next.js", "Telegram Mini App")
    ContainerDb(postgres, "PostgreSQL + pgvector", "Database", "Relational data + vectors")
    ContainerDb(redis, "Redis", "Cache + Queue", "Sessions, cache, BullMQ")
  }

  Rel(user, bot, "Telegram messages")
  Rel(admin, dashboard, "HTTPS")
  Rel(bot, postgres, "Prisma + Drizzle")
  Rel(bot, redis, "ioredis")
  Rel(dashboard, postgres, "Prisma")
  Rel(dashboard, redis, "ioredis")
  Rel(miniapp, bot, "Hono API")
```

---

## Diagram 3 — Layer Architecture

```mermaid
graph TB
  subgraph Interface["Interface Layer — apps/"]
    BS[bot-server<br>grammY + Hono]
    DB[dashboard<br>Next.js]
    MA[mini-app<br>Next.js]
  end

  subgraph Service["Service Layer — packages/"]
    LOG[logger<br>Pino + Audit]
    SH[shared<br>cache + queue factory]
    DBS[database<br>Prisma + Drizzle]
    AUTH[auth-core<br>CASL]
    SM[session-manager<br>Redis + PG]
    EB[event-bus<br>EventEmitter + Redis]
    AI[ai-core<br>Vercel AI SDK]
    I18N[i18n-core<br>i18next]
    UX[ux-helpers]
    NOT[notifier<br>BullMQ]
    SE[search-engine]
    ST[storage-engine]
  end

  subgraph Core["Core Layer — modules/"]
    M1[module-1]
    M2[module-2]
    MN[module-n]
  end

  Interface --> Service
  Service --> Core
  Core --> EB
  EB --> Core
```

---

## Diagram 4 — Security Chain

```mermaid
flowchart LR
  IN[Incoming Request] --> SH[sanitize-html\nXSS prevention]
  SH --> RL[@grammyjs/ratelimiter\nSpam protection]
  RL --> CASL[CASL Auth Check\nRole verification]
  CASL --> ZOD[Zod Validation\nSchema enforcement]
  ZOD --> BL[Business Logic]
  BL --> AL[Audit Log\nState change recorded]
  AL --> OUT[Response]

  style SH fill:#fef3c7
  style RL fill:#fef3c7
  style CASL fill:#fee2e2
  style ZOD fill:#fef3c7
  style AL fill:#d1fae5
```

---

## Diagram 5 — Event Bus Flow

```mermaid
graph LR
  subgraph Module A
    MA_S[Service A]
  end

  subgraph EventBus["Event Bus (packages/event-bus)"]
    LOCAL[Local EventEmitter\nin-process]
    INTERNAL[Internal Bus\ncross-module]
    EXTERNAL[External\nRedis Pub/Sub]
  end

  subgraph Module B
    MB_L[Listener B]
  end

  subgraph Module C
    MC_L[Listener C]
  end

  MA_S -- "module.entity.action" --> LOCAL
  LOCAL --> INTERNAL
  INTERNAL --> EXTERNAL
  INTERNAL --> MB_L
  EXTERNAL --> MC_L

  style LOCAL fill:#e0f2fe
  style INTERNAL fill:#bae6fd
  style EXTERNAL fill:#7dd3fc
```

---

## Diagram 6 — Module Anatomy

```mermaid
graph TD
  subgraph Module["modules/{name}/"]
    IDX[index.ts\nregistration + listeners]
    CFG[module.config.ts\nfeatures + roles]
    AB[abilities.ts\nCASL definitions]
    
    subgraph Features["features/"]
      subgraph Feature["create/"]
        H[create.handler.ts]
        S[create.service.ts]
        C[create.conversation.ts]
        T[create.test.ts]
      end
    end

    subgraph Shared["shared/"]
      R[entity.repository.ts]
      TY[types.ts]
    end

    subgraph Locales["locales/"]
      AR[ar.json]
      EN[en.json]
    end

    subgraph DB["database/"]
      SCH[schema.prisma]
      MIG[migrations/]
    end
  end
```

---

## Diagram 7 — Session Architecture

```mermaid
sequenceDiagram
  participant Bot as bot-server
  participant SM as session-manager
  participant Redis
  participant PG as PostgreSQL

  Bot->>SM: getSession(userId)
  SM->>Redis: GET session:{userId}
  alt Cache hit
    Redis-->>SM: session data
  else Cache miss
    SM->>PG: SELECT FROM sessions
    PG-->>SM: session data
    SM->>Redis: SET session:{userId} TTL=30m
  end
  SM-->>Bot: SessionData

  Bot->>SM: updateSession(userId, data)
  SM->>Redis: SET session:{userId}
  SM->>PG: UPDATE sessions (async via Event Bus)
```

---

## Diagram 8 — CASL Authorization Flow

```mermaid
flowchart TD
  REQ[Request] --> SESSION[Load Session\nget user role]
  SESSION --> ABILITY[Build CASL Ability\ndefineAbility by role]
  ABILITY --> CHECK{can user perform\naction on resource?}
  CHECK -- Yes --> REPO[BaseRepository\nPrisma query with\naccessibleBy filter]
  CHECK -- No --> DENY[Return DENIED\nlog in Audit Log]
  REPO --> DATA[Return data]

  SUPER_ADMIN[SUPER_ADMIN] -- "can('manage','all')" --> ABILITY
```

---

## Diagram 9 — Cache Hierarchy

```mermaid
graph TD
  REQ[Cache Request] --> L1{Memory Cache\nL1}
  L1 -- Hit --> RET1[Return value]
  L1 -- Miss --> L2{Redis Cache\nL2}
  L2 -- Hit --> L1W[Write to L1]
  L1W --> RET2[Return value]
  L2 -- Miss --> L3{PostgreSQL\nL3}
  L3 --> L2W[Write to L2 + L1]
  L2W --> RET3[Return value]

  UPDATE[Cache Update] --> INV[Invalidate L1 + L2]
  INV --> DB[Write to PostgreSQL]

  style L1 fill:#d1fae5
  style L2 fill:#bae6fd
  style L3 fill:#e0e7ff
```

---

## Diagram 10 — Graceful Shutdown Sequence

```mermaid
sequenceDiagram
  participant OS as OS Signal
  participant HONO as Hono Server
  participant BOT as grammY Bot
  participant BQ as BullMQ Workers
  participant REDIS as Redis
  participant PRISMA as Prisma
  participant DRIZZLE as Drizzle Pool

  OS->>HONO: SIGTERM
  Note over HONO: Stop accepting new requests
  HONO->>BOT: close()
  Note over BOT: Complete pending updates (10s max)
  BOT->>BQ: closeAll() via queue factory
  Note over BQ: Drain active jobs (15s max)
  BQ->>REDIS: quit()
  REDIS->>PRISMA: $disconnect()
  PRISMA->>DRIZZLE: pool.end()
  DRIZZLE-->>OS: process.exit(0)

  Note over OS: Max total: 30 seconds
  Note over OS: Exceeded → process.exit(1) + FATAL log
```

---

## Diagram 11 — Document Engine Event Flow

```mermaid
sequenceDiagram
  participant MOD as Module
  participant EB as Event Bus
  participant DE as document-engine
  participant SE as storage-engine
  participant BOT as bot-server

  MOD->>EB: document.export.requested
  EB->>DE: listener triggered
  DE->>DE: CASL auth check
  DE->>DE: generate PDF/Excel via BullMQ
  DE->>SE: upload file
  SE-->>DE: fileUrl + metadata
  DE->>EB: document.export.completed
  EB->>BOT: listener triggered
  BOT->>MOD: notify user with download link
```
