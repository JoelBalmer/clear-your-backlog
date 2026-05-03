# Roadmap

The project is built in 7 phases. Each phase is a checkpoint: planned in [Claude Code](https://docs.claude.com/en/docs/claude-code) plan mode, implemented as one or more commits, then user-reviewed before the next phase starts.

Last updated: 2026-05-03

---

## Status

| Phase | Title                                  | Status         |
| ----- | -------------------------------------- | -------------- |
| 1     | Scaffold + Vercel + GitHub + CI        | ✅ Complete     |
| 2     | DB schema (Neon + Drizzle)             | ✅ Complete     |
| 3     | Auth (Clerk) + onboarding + tab shell  | ✅ Complete     |
| 4     | IGDB proxy + permission-gated APIs     | ⏳ Up next      |
| 5     | Core screens (Library, Discover, etc.) | ⬜ Pending      |
| 6     | Reusable components polish             | ⬜ Pending      |
| 7     | Full README + mobile build instructions| ⬜ Pending      |

---

## Phase 1 — Scaffold + Vercel + GitHub + CI ✅

- Ionic 8 + React 19 + TypeScript + Vite scaffold
- Vercel project linked, prod deploys via CLI working at https://clear-your-backlog.vercel.app
- GitHub repo `FikretHassan/clear-your-backlog` (private)
- `vercel.json` with `framework: vite` and SPA rewrites for client-side routing
- GitHub Actions CI: typecheck + lint on PRs
- Node 22 pinned in `engines` and CI

## Phase 2 — DB schema (Neon + Drizzle) ✅

- Neon Postgres provisioned via Vercel Marketplace (auto-injects `DATABASE_URL`)
- Drizzle ORM with `@neondatabase/serverless` HTTP driver (works inside Vercel functions without TCP/cold-start issues)
- 6 tables: `profiles`, `games_cache`, `user_games`, `tags`, `user_game_tags`, `follows`
- All FKs with `on delete cascade`, check constraints (status enum, rating range, no self-follow), unique indexes (per-user game, per-user tag, lower(username))
- `profiles.id` is `text` because Clerk userIds are strings (`user_2abc…`)
- Migration `drizzle/0000_fluffy_hawkeye.sql` applied
- Migration scripts: `db:generate`, `db:migrate`, `db:push`, `db:studio`
- No DB-level RLS (we lost it by leaving Supabase) — permissions enforced in API route handlers in Phase 4

## Phase 3 — Auth (Clerk) + onboarding + tab shell ✅

- Clerk provisioned via Vercel Marketplace (auto-injects `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`)
- `vite.config.ts` aliases `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` → `VITE_CLERK_PUBLISHABLE_KEY` at build time so we don't have to provision a separate Vercel env var
- `<ClerkProvider>` wraps the app in `src/main.tsx`
- Routes: `/sign-in`, `/sign-up`, `/onboarding`, `/tabs/{library,discover,friends,profile}`
- `<RequireAuth>` and `<RequireOnboarded>` wrappers gate routes
- IonTabs shell with Library / Discover / Friends / Profile (last 3 are placeholder pages)
- API: `GET /api/me`, `POST /api/profile` (claim/update username), `GET /api/profile/check-username?u=…` (live availability)
- Onboarding flow: sign up → claim username with debounced availability check → land on Library
- Profile page reads `/api/me` and includes a SignOut button
- No Clerk webhook for profile creation — profiles are created lazily on first onboarding submit. Webhook for `user.deleted` cleanup deferred until needed.

## Phase 4 — IGDB proxy + permission-gated APIs ⏳

- `api/igdb-search.ts` — Vercel function: cached Twitch token, IGDB v4 search, cover URL transform, Clerk JWT required, CORS allowlist
- `src/lib/igdb/search.ts` — frontend wrapper
- API routes that replace what Supabase RLS would have done — each verifies the Clerk session and scopes writes to `userId === session.userId`:
  - `POST /api/user-games` — add game to library
  - `PATCH /api/user-games/:id` — update rating/status/notes
  - `DELETE /api/user-games/:id` — remove from library
  - `GET /api/user-games?userId=...` — read (public)
  - `POST /api/follows` / `DELETE /api/follows/:followingId`
  - `GET /api/follows?userId=...`
  - CRUD for `/api/tags`
  - Tag join writes via `/api/user-games/:id/tags`
- Vercel env vars: `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`

## Phase 5 — Core screens ⬜

- Add Game modal (debounced IGDB search → status/rating/platform/notes/tags sheet)
- Library page: All / Backlog / Playing / Played / Dropped segment, multi-tag chip filter, sort by rating / recent / alpha
- Game Detail: cover, summary, your meta, friends-who-played list (followed users + their ratings)
- Discover: activity feed (followed users' recent rates and status changes), top-rated leaderboard
- Friends: search by username, Following / Followers tabs
- Profile: self at `/tabs/profile`, others at `/u/:username`; top-rated games, recent activity, public tag-filtered lists, follow/unfollow

## Phase 6 — Reusable components ⬜

- `StarRating` (display + input, half-star)
- `GameCard`, `TagChip`, `StatusBadge`, `EmptyState`, `UserListItem`, `RatingSlider`
- Polish placeholders into shared building blocks

## Phase 7 — README + mobile build ⬜

- Expand README with feature tour and screenshots
- Document mobile build (`npx cap add ios|android`, signing, App Store / Play Store basics)
- Document operational concerns: how to roll a Clerk-only / Neon-only credential rotation, where logs live in Vercel

---

## Open architectural questions to revisit

- Activity feed: cheap path is `select recent user_games where user_id in (followed)`. If feed performance starts to suffer, denormalize to an `activity` table written to from API routes. Defer until measured.
- Whether to allow global tag suggestions (autocomplete from popular tags across all users) vs. strictly per-user. Currently per-user only.
- Clerk free tier ships a Clerk-branded login page. Custom subdomain costs money — accepting the default for now.
- Whether to add a Clerk webhook (`user.deleted`) for cleanup. Currently profiles cascade-delete only when triggered by API call; Clerk-side deletion would orphan rows.
