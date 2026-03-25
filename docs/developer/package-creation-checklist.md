# Package Creation Checklist

> **Authority:** Constitution Rules LXXI–LXXVIII
> **When to use:** Before writing any code for a new package
> **Enforcement:** All 10 checks must pass before the first commit

---

## The 10-Point Checklist

### Infrastructure (must exist before `src/index.ts`)

- [ ] **1. `.gitignore`** — exists in the package directory, contains:
  ```
  dist/
  node_modules/
  *.tsbuildinfo
  src/**/*.js
  src/**/*.js.map
  src/**/*.d.ts
  src/**/*.d.ts.map
  tests/**/*.js
  tests/**/*.d.ts
  ```

- [ ] **2. `tsconfig.json`** — exists, contains `"outDir": "dist"`. Verify:
  ```bash
  grep '"outDir"' packages/{name}/tsconfig.json
  # Must output: "dist" — never "src" or "."
  ```

- [ ] **3. `package.json`: main + types** — point to `dist/`:
  ```json
  "main": "dist/index.js",
  "types": "dist/index.d.ts"
  ```

- [ ] **4. `package.json`: exports** — field exists:
  ```json
  "exports": { ".": "./dist/index.js" }
  ```

- [ ] **5. `package.json`: build script** — exists:
  ```json
  "build": "tsc"
  ```

- [ ] **6. `vitest.config.ts`** — exists at package root

- [ ] **7. `package.json`: vitest version** — exact, no caret:
  ```json
  "vitest": "4.1.0"
  ```

### Code Quality (verified before every merge)

- [ ] **8. No `console.*` in `src/`** — verify clean:
  ```bash
  grep -rn "console\." packages/{name}/src/
  # Expected: no output
  ```

- [ ] **9. No phantom dependencies** — every dep is imported in `src/`:
  ```bash
  # For each dep in package.json, run:
  grep -r "from 'dep-name'" packages/{name}/src/
  # Expected: at least one match
  ```

- [ ] **10. Clean workspace** — no compiled artifacts in `src/`:
  ```bash
  find packages/{name}/src -name "*.js" -o -name "*.d.ts"
  # Expected: no output
  ```

---

## Quick Setup Commands

Run these once when creating a new package:

```bash
# 1. Create directory structure
mkdir -p packages/{name}/src packages/{name}/tests/unit

# 2. Verify no artifacts in src/ before starting
find packages/{name}/src -name "*.js" -o -name "*.d.ts"

# 3. After any build, verify artifacts went to dist/ not src/
ls packages/{name}/dist/
find packages/{name}/src -name "*.js"  # must be empty
```

---

## Why Each Check Exists

| Check | Root Cause |
|-------|-----------|
| `.gitignore` | Compiled artifacts committed to `src/` pollute module resolution |
| `outDir: dist` | 172 artifact incident (2026-03-24): tsc wrote to `src/`, Vitest loaded stale `.js` |
| `exports → dist` | Consumers resolve via exports first; `src/` path breaks production builds |
| `vitest: "4.1.0"` exact | Wrong major (1.x vs 4.x) caused silent API mismatches |
| No `console.*` | Production logs must be structured JSON via Pino; console breaks log aggregation |
| No phantom deps | Phantom deps inflate install size and mislead consumers about requirements |
| Clean workspace | Stale `.js` files shadow `.ts` source; Vitest picks up old code silently |
