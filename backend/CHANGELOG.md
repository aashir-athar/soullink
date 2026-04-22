# CHANGELOG — Soullink Backend
## 2026-04-17 — Dependency & API modernisation pass

### Breaking changes you must action before deploying

| Area | What changed | Action needed |
|---|---|---|
| Clerk SDK | `@clerk/clerk-sdk-node` removed; replaced with `@clerk/express` 2.x | Update env var names if any changed in Clerk dashboard |
| dotenv | `dotenv` 17 no longer has a default export; must use `import { config } from 'dotenv'` | Already updated in `src/index.ts` |
| Express | v4 → v5. Path params now require bracket notation `req.params['id']` | Already updated everywhere |
| Mongoose | v8 → v9. `autoIndex` now defaults to `true`; explicitly set `false` in production | Pass `autoIndex: false` via env or update connect call |
| TypeScript | v5 → v6. Stricter module resolution (`Node16`); imports need `.js` extensions | Already updated all internal imports |
| multer | v1 → v2. API surface is identical for our use case; no code changes needed | — |

---

### Package version changes

| Package | Old | New |
|---|---|---|
| `@clerk/clerk-sdk-node` | ^5.0.44 | **removed** |
| `@clerk/express` | — | ^2.1.4 *(new)* |
| `express` | ^4.21.2 | ^5.2.1 |
| `express-rate-limit` | ^7.5.0 | ^8.3.2 |
| `mongoose` | ^8.9.3 | ^9.4.1 |
| `dotenv` | ^16.4.7 | ^17.4.2 |
| `multer` | ^1.4.5-lts.1 | ^2.1.1 |
| `cloudinary` | ^2.5.1 | ^2.9.0 |
| `compression` | ^1.7.5 | ^1.8.1 |
| `cors` | ^2.8.5 | ^2.8.6 |
| `morgan` | ^1.10.0 | ^1.10.1 |
| `socket.io` | ^4.8.1 | ^4.8.3 |
| `winston` | ^3.17.0 | ^3.19.0 |
| `@types/express` | ^5.0.0 | ^5.0.6 |
| `@types/node` | ^22.10.7 | ^25.6.0 |
| `tsx` | ^4.19.2 | ^4.21.0 |
| `typescript` | ^5.8.3 | ^6.0.3 |

---

### Code-level improvements (beyond version bumps)

**src/index.ts**
- `dotenv` now uses named `config()` import (v17 breaking change)
- Socket.io `connectionStateRecovery` enabled (4.8 feature, 2-min recovery window)
- Global error handler uses `unknown` type + narrowed access instead of `any`
- `process.env` accesses use bracket notation for TS6 strict mode

**src/middleware/auth.ts**
- Replaced `createClerkClient` from `@clerk/clerk-sdk-node` with `@clerk/express`
- API call signature is identical — no route changes needed

**src/models/index.ts**
- `optimisticConcurrency: true` on `UserSchema` (Mongoose 9 feature) — prevents silent lost-updates on concurrent profile edits
- `autoIndex` moved to `connect()` call, controlled by `NODE_ENV`
- `type` imports used throughout (`import type { Document }`)

**src/routes/discover.ts**
- `express-rate-limit` 8.x: `rateLimit` is now a named export; `limit` replaces deprecated `max`; `standardHeaders: 'draft-8'` enables latest RateLimit headers
- Swipe burst limiter added (60 req/min)
- `blockedUsers` exclusion consolidated into single `$nin` array (one fewer condition branch)
- All `err: any` replaced with `err: unknown` + `instanceof Error` narrowing

**src/routes/profile.ts**
- `multer` 2.x: no API changes for our memoryStorage use case
- Cloudinary upload promise narrowed to explicit result type
- `req.params` uses bracket notation throughout

**src/socket.ts**
- Migrated to `@clerk/express` `createClerkClient`
- Added `typing` / `stop-typing` events for chat indicator support
- `disconnect` handler now logs reason string
- `socket.join` / `socket.leave` properly `void`-prefixed (returns Promise in 4.8)

**src/services/logger.ts**
- Destructured `winston.format` for cleaner composition
- Added `exceptionHandlers` and `rejectionHandlers` (Winston 3.x best practice — catches unhandled exceptions/rejections and logs before crash)

**src/routes/ (safety, notifications, users, messages, matches)**
- Split out of the mega-file `matches.ts` into individual route files — matches how `index.ts` imports them
- All `err: any` → `err: unknown` with safe narrowing

---

### Migration steps

```bash
# 1. Replace node_modules with updated deps
npm install

# 2. Verify TypeScript compiles cleanly
npm run typecheck

# 3. Start dev server
npm run dev
```
