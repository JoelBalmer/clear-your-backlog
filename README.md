# Clear Your Backlog

Personal game rating + social app. Track what you've played, rate it on a half-star 0–10 scale, organise your library with tags, follow friends and see what they're playing. Mobile-first via Ionic; ships to web (Vercel) and to iOS / Android (Capacitor) from one codebase.

> **Status:** All 7 phases complete. See [ROADMAP.md](./ROADMAP.md) for the build history.

---

## Features

- **Sign up / sign in** via Clerk (email + password by default; Google/GitHub one-click if you flip them on in the Clerk dashboard)
- **Onboarding** — claim a unique username with live availability check
- **Library** — search the IGDB catalogue, add games with status (Backlog / Playing / Played / Dropped), rating (half-star, 0.5–10), notes, and tags
- **Tag system** — per-user tags ("co-op", "Steam Deck", "weekend backlog"). Multi-select chip filter on Library narrows the list (AND-filter).
- **Game detail** — cover, summary, your meta (auto-saves on change/blur), "Friends who played this" list with their ratings
- **Friends** — username search, follow / unfollow with optimistic toggle, Following / Followers tabs
- **Discover feed** — recent activity (rates and status changes) from people you follow
- **Public profiles** at `/tabs/u/:username` — avatar, follower / following / games stats, top-rated list, follow button
- **Mobile-first UI** built with Ionic; respects system dark mode; safe-area aware
- **Code-split** routes — initial JS payload only loads the auth/onboarding screens; tab pages lazy-load on first visit

## Stack

| Concern        | Tool                                                            |
| -------------- | --------------------------------------------------------------- |
| Frontend       | Ionic 8 + React 19 + TypeScript + Vite                          |
| Mobile shell   | Capacitor 8 (iOS / Android added on demand via `npx cap add`)   |
| Database       | Neon (serverless Postgres, free tier 0.5 GB / 190 compute hrs)  |
| ORM            | Drizzle + `@neondatabase/serverless` HTTP driver                |
| Auth           | Clerk (free tier 10k MAU)                                       |
| API            | Vercel Serverless Functions (Node 22) in `/api`                 |
| IGDB           | Vercel function `/api/igdb-search` (Twitch app token)           |
| Hosting        | Vercel (auto-deploys from `main`, PR previews)                  |
| CI             | GitHub Actions: typecheck (frontend + api) + lint on PRs        |

Neon and Clerk are installed via the Vercel Marketplace, which auto-syncs their env vars to all environments.

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

## Scripts

| Command               | What it does                                                          |
| --------------------- | --------------------------------------------------------------------- |
| `npm run dev`         | Vite dev server                                                       |
| `npm run build`       | Production build (`tsc && vite build` → `dist/`)                      |
| `npm run typecheck`   | TS check for both `src/` (DOM) and `api/` (Node)                      |
| `npm run lint`        | ESLint flat config                                                    |
| `npm run db:generate` | Diff `api/_lib/schema.ts` vs migration history → write SQL            |
| `npm run db:migrate`  | Apply pending migrations to `DATABASE_URL_UNPOOLED`                   |
| `npm run db:push`     | Push schema directly without a migration file (dev only)              |
| `npm run db:studio`   | Drizzle Studio: visual DB browser at https://local.drizzle.studio    |
| `npm run test.unit`   | Vitest                                                                |
| `npm run test.e2e`    | Cypress                                                               |

---

## Project layout

```
api/                    # Vercel serverless functions, one per route.
                        # IMPORTANT: relative imports MUST use .js extensions (Node ESM).
  _lib/                 # private (underscore prefix) — not exposed as routes; bundled with siblings
    auth.ts             # Clerk JWT verification (createClerkClient + authenticateRequest)
    db.ts               # Drizzle client (Neon HTTP driver)
    schema.ts           # All Drizzle table definitions
    igdb.ts             # Twitch token cache + IGDB v4 search/fetch helpers
  me.ts                 # GET    /api/me                       — current user's profile
  profile.ts            # POST   /api/profile                  — claim/update username
                        # GET    /api/profile?check=foo        — username availability check
  user-games.ts         # GET    /api/user-games?status=&sort=&tags=&userId=  — list
                        # POST   /api/user-games               — add game (upserts cache, links tags)
  user-games/
    [id].ts             # PATCH  /api/user-games/:id           — rating/status/notes
                        # DELETE /api/user-games/:id
  user-game-tags.ts     # POST   /api/user-game-tags           — link a tag to a user_game
                        # DELETE /api/user-game-tags?userGameId=&tagId=
  tags.ts               # GET    /api/tags                     — caller's tags
                        # POST   /api/tags                     — create tag
                        # DELETE /api/tags?id=                 — delete tag
  games/
    [igdbId].ts         # GET    /api/games/:igdbId            — cache, fallback to IGDB
  game-friends.ts       # GET    /api/game-friends?igdbId=     — followees who own this game
  igdb-search.ts        # GET    /api/igdb-search?q=…          — Twitch-cached IGDB search
                        # GET    /api/igdb-search?rail=popular|upcoming|top  — editorial rails
  follows.ts            # GET    /api/follows?userId=&role=    — followers OR following list
                        # POST   /api/follows                  — follow
                        # DELETE /api/follows?followingId=     — unfollow
  users.ts              # GET    /api/users?q=                 — username prefix search
                        # GET    /api/users?username=foo       — public profile + counts
  feed.ts               # GET    /api/feed                     — activity from followees

src/
  components/           # AddGameModal, ManageTagsModal, GameCard, StarRating, StatusBadge,
                        # TagChip, TagPicker, UserListItem, RequireAuth, RequireOnboarded, …
  contexts/
    MeContext.tsx       # useMe() — single source of truth for caller's profile
  hooks/                # (reserved)
  lib/
    api.ts              # useApi() — fetch wrapper that injects Clerk JWT
    igdb/
      search.ts         # Frontend wrapper for /api/igdb-search
  pages/                # Tabs.tsx, Library, Discover, Friends, Profile, GameDetail,
                        # PublicProfile, SignInPage, SignUpPage, OnboardingPage
  theme/                # Ionic CSS variables + app-level styles
  types/
    models.ts           # Plain TS shapes for API responses (decoupled from Drizzle)

drizzle/                # Generated SQL migrations (committed)
.github/workflows/      # CI
```

---

## Deploy

- Push to `main` → Vercel auto-deploys to prod (assuming the Vercel GitHub App is connected for the repo at https://vercel.com/your-team/clear-your-backlog/settings/git)
- Open a PR → Vercel posts a preview URL automatically
- CI runs `npm run typecheck` + `npm run lint` on every PR

Live URL: https://clear-your-backlog.vercel.app

If GitHub auto-deploy isn't connected, deploy manually:
```bash
vercel --prod
```

## Env vars

All env vars are managed in Vercel and pulled locally via `vercel env pull`. Names below are documented in [`.env.example`](./.env.example).

| Var                                  | Source                  | Used by                                                          |
| ------------------------------------ | ----------------------- | ---------------------------------------------------------------- |
| `DATABASE_URL`                       | Neon integration        | API routes (Drizzle, pooled connection)                          |
| `DATABASE_URL_UNPOOLED`              | Neon integration        | `drizzle-kit migrate` (direct connection — pgbouncer-free)       |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`  | Clerk integration       | Frontend (aliased → `VITE_CLERK_PUBLISHABLE_KEY` in `vite.config.ts`) |
| `CLERK_SECRET_KEY`                   | Clerk integration       | API routes (verify session + JWT)                                |
| `TWITCH_CLIENT_ID` / `_SECRET`       | **Manual** (see below)  | `/api/igdb-search` (server-only)                                 |

### Setting up Twitch / IGDB credentials

IGDB is free but requires a Twitch developer app (Twitch owns IGDB). Once per project:

1. Sign in at https://dev.twitch.tv/console
2. **Register Your Application**: name `clear-your-backlog`, OAuth Redirect URLs `http://localhost`, Category **Application Integration**
3. Copy the **Client ID** and click **New Secret** for the **Client Secret**
4. Add both to Vercel:
   ```bash
   vercel env add TWITCH_CLIENT_ID
   vercel env add TWITCH_CLIENT_SECRET
   # paste each value when prompted; pick "all environments" (production / preview / development)
   ```
5. Redeploy: `vercel --prod`

Until the creds are added, `/api/igdb-search` returns HTTP 503 with a clear message. The rest of the app works (you just can't add new games via search; existing libraries still load).

---

## Mobile builds (Capacitor)

The web app is the source of truth. Mobile builds wrap the same `dist/` bundle in a native shell with access to native APIs (haptics, status bar, push notifications, etc.).

### iOS (requires macOS + Xcode)

```bash
# One-time setup
npx cap add ios
npm run build && npx cap sync ios

# Open Xcode and run on simulator / device
npx cap open ios
```

In Xcode: pick a team in **Signing & Capabilities**, set bundle ID (default is `io.ionic.starter` from `capacitor.config.ts` — change it), pick a target device, hit run. For App Store submission, follow Apple's standard archive + upload flow.

### Android (requires Android Studio)

```bash
# One-time setup
npx cap add android
npm run build && npx cap sync android

# Open Android Studio
npx cap open android
```

In Android Studio: pick a target device, hit run. For Play Store submission, generate a signed bundle via **Build → Generate Signed Bundle / APK**.

### After every web change

```bash
npm run build && npx cap sync   # pushes the new dist/ into the native projects
```

For dev iteration on a real device with hot reload, see Capacitor's [live-reload docs](https://capacitorjs.com/docs/guides/live-reload).

### Native API access

Capacitor 8 plugins are already installed (`@capacitor/app`, `haptics`, `keyboard`, `status-bar`). Add more from https://capacitorjs.com/docs/plugins as needed.

---

## Permissions model

We swapped Supabase for Neon + Clerk early in the project, so we don't have database-level Row-Level Security. Instead, every mutation in `api/` calls `requireAuth(req, res)` from `api/_lib/auth.ts`, which verifies the Clerk session via `createClerkClient().authenticateRequest()` and returns the caller's `userId`. Each handler then scopes writes to `userId === session.userId`. Public reads (other users' libraries, follower lists) are open by design.

Read endpoints worth highlighting:
- `/api/user-games?userId=X` — public, used by `/tabs/u/:username` to render someone's library
- `/api/follows?userId=X&role=...` — public, used by Friends tabs and public profiles
- `/api/users/:username` — public, computes counts and (with auth) `isFollowing`/`isSelf`

---

## Architectural notes

- **DB modules live in `api/_lib/`, not `src/lib/`**. Vercel's @vercel/node bundler pulls in files relative to the `api/` tree; anything outside isn't bundled. Frontend uses plain TS shapes in `src/types/models.ts` instead of the Drizzle-inferred types, which keeps the bundle clean of Drizzle internals.
- **Relative imports inside `api/` MUST use `.js` extensions.** `package.json` has `"type": "module"` so the runtime is ESM, which mandates extensions. TypeScript treats `./_lib/db.js` as a TS import to `./_lib/db.ts`, and the compiled output preserves the string. (This bit us hard in Phase 3; everything 500'd silently until I traced it.)
- **Activity feed is intentionally simple** — `select user_games where user_id in (followed) order by updated_at desc limit 50`. If feed performance becomes a problem, denormalize to an `activity` table written from API routes.
- **Tags are strictly per-user.** No global suggestions, no shared taxonomy. Filter is AND (a game must have all selected tags to appear).
- **Profile creation is lazy** — the Clerk webhook for `user.created` was deferred. The profiles row is inserted on first onboarding submit. Side effect: Clerk-side user deletion can leave orphan profile rows. Add the webhook later if that becomes an issue.

---

## Contributing

See [ROADMAP.md](./ROADMAP.md) for the phased build plan and the full per-phase changelog. Each phase shipped as one or more commits on `main`; planning happened in [Claude Code](https://docs.claude.com/en/docs/claude-code) plan mode before implementation.
