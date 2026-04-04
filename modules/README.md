# modules/

This directory contains independent business modules.

Each module follows the mandatory structure defined in the Project Constitution (Section 15):

```
modules/{name}/
├── index.ts
├── module.config.ts
├── abilities.ts
├── features/
│   └── {feature}/
│       ├── {feature}.handler.ts
│       ├── {feature}.service.ts
│       ├── {feature}.conversation.ts
│       └── {feature}.test.ts
├── shared/
│   ├── {entity}.repository.ts
│   └── types.ts
├── locales/
│   ├── ar.json
│   └── en.json
├── database/
│   ├── schema.prisma
│   └── migrations/
└── tests/
```

No module can be created without an approved `spec.md` in `/specs/`.
