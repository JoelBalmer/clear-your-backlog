# Clear Your Backlog

Personal game rating + social app. Track what you've played, rate it, share lists with friends. Mobile-first via Ionic, ships to web (Vercel) and later to iOS/Android (Capacitor).

> **Status:** Phase 3 of 7 (auth complete). See [ROADMAP.md](./ROADMAP.md) for the full plan and current progress.

---

## Stack

| Concern        | Tool                                                            |
| -------------- | --------------------------------------------------------------- |
| Frontend       | Ionic 8 + React 19 + TypeScript + Vite                          |
| Mobile shell   | Capacitor 8 (iOS/Android added in a later phase via `npx cap add`) |
| Database       | Neon (serverless Postgres, free tier)                           |
| ORM            | Drizzle + `@neondatabase/serverless` HTTP driver                |
| Auth           | Clerk (free tier, 10k MAU)                                      |
| API            | Vercel Serverless Functions (Node 22) in `/api`                 |
| IGDB proxy     | Vercel function `/api/igdb-search` (added in Phase 4)           |
| Hosting        | Vercel (auto-deploys from `main`, PR previews)                  |
| CI             | GitHub Actions: typecheck (frontend + api) + lint on PRs        |

Neon and Clerk are installed via the Vercel Marketplace, which auto-syncs their env vars to all Vercel environments.

---

## Local setup

Requires Node 22+, the Vercel CLI (`npm i -g vercel`), and the GitHub CLI for repo operations.

```bash
git clone https://github.com/FikretHassan/clear-your-backlog
cd clear-your-backlog
npm install

# Pull Neon + Clerk env vars from Vercel into a gitignored local file
vercel link            # one-time, links this folder to the Vercel project
vercel env pull .env.development.local

# Apply the latest DB migrations to your Neon dev branch
npm run db:migrate

# Start the dev server
npm run dev            # http://localhost:5173
```

---

## Scripts

| Command               | What it does                                                          |
| --------------------- | --------------------------------------------------------------------- |
| `npm run dev`         | Vite dev server                                                       |
| `npm run build`       | Production build (`tsc && vite build` → `dist/`)                      |
| `npm run typecheck`   | TS check for both `src/` (DOM) and `api/` (Node)                      |
| `npm run lint`        | ESLint flat config                                                    |
| `npm run db:generate` | Diff `src/lib/db/schema.ts` vs migration history → write SQL          |
| `npm run db:migrate`  | Apply pending migrations to the DB pointed to by `DATABASE_URL_UNPOOLED` |
| `npm run db:push`     | Push schema directly without a migration file (dev only)              |
| `npm run db:studio`   | Drizzle Studio: visual DB browser at https://local.drizzle.studio    |
| `npm run test.unit`   | Vitest                                                                |
| `npm run test.e2e`    | Cypress                                                               |

---

## Project layout

```
api/                    # Vercel serverless functions, one per route
  _lib/                 # private (underscore prefix) — not exposed as routes
    auth.ts             # Clerk JWT verification helper for API handlers
  me.ts                 # GET  /api/me                 — current user's profile
  profile.ts            # POST /api/profile            — claim/update username
  profile/
    check-username.ts   # GET  /api/profile/check-username?u=foo

src/
  components/           # Shared React components (RequireAuth, PlaceholderPage, …)
  contexts/             # React contexts (filled in later phases)
  hooks/                # Custom hooks (filled in later phases)
  lib/
    api.ts              # useApi() — fetch wrapper that injects Clerk JWT
    db/
      client.ts         # Drizzle client (Neon HTTP driver)
      schema.ts         # All table definitions + inferred types
    igdb/               # IGDB client (Phase 4)
  pages/                # One file per top-level route
  theme/                # Ionic CSS variables + app-level styles
  types/                # Type augmentations

drizzle/                # Generated SQL migrations (committed)
.github/workflows/      # CI
```

---

## Deploy

- Push to `main` → Vercel auto-deploys to prod
- Open a PR → Vercel posts a preview URL (requires Vercel GitHub App installed for the repo)
- CI runs `npm run typecheck` + `npm run lint` on every PR

Live URL: https://clear-your-backlog.vercel.app

---

## Env vars

All env vars are managed in Vercel and pulled locally via `vercel env pull`. Names below are documented in [`.env.example`](./.env.example).

| Var                                  | Source             | Used by                                    |
| ------------------------------------ | ------------------ | ------------------------------------------ |
| `DATABASE_URL`                       | Neon integration   | API routes (Drizzle, pooled connection)    |
| `DATABASE_URL_UNPOOLED`              | Neon integration   | `drizzle-kit migrate` (direct connection)  |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`  | Clerk integration  | Frontend (aliased to `VITE_CLERK_PUBLISHABLE_KEY` at build time in `vite.config.ts`) |
| `CLERK_SECRET_KEY`                   | Clerk integration  | API routes (verify JWT)                    |
| `TWITCH_CLIENT_ID` / `_SECRET`       | Manual (Phase 4)   | `/api/igdb-search` (server-only)           |

---

## Mobile builds (later)

Native iOS/Android targets are not added yet. To add them once Phase 4–5 are stable:

```bash
npx cap add ios
npx cap add android
npm run build && npx cap sync
npx cap open ios       # or android
```

---

## Contributing

See [ROADMAP.md](./ROADMAP.md) for the phased build plan. Each phase ships as one or more commits on `main`; planning happens in [Claude Code](https://docs.claude.com/en/docs/claude-code) plan mode before implementation.
