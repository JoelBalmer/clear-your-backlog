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
| 4     | IGDB proxy + Library + GameDetail      | ✅ Complete     |
| 5     | Discover + Friends + public profiles   | ✅ Complete     |
| 6     | Tags + multi-tag filter + code-split   | ✅ Complete     |
| 7     | Full README + Capacitor mobile docs    | ✅ Complete     |
| 8     | IGDB editorial rails on Discover       | ✅ Complete     |

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

## Phase 4 — IGDB proxy + Library + GameDetail ✅

- `api/igdb-search.ts` — Twitch app token cached in module scope (refreshed on 401), IGDB v4 search, cover URL transform, Clerk auth required, CORS allowlist. Returns 503 with a clear message if Twitch creds aren't set.
- `api/_lib/igdb.ts` — shared Twitch token cache + `searchIgdb()` + `fetchIgdbGame(id)`.
- `api/user-games.ts` — `GET ?userId=&status=&sort=` (public read; defaults to caller's library), `POST` (add to caller's library, upserts games_cache).
- `api/user-games/[id].ts` — `PATCH` (rating/status/notes/playedOn/playedAt — auth-scoped), `DELETE`.
- `api/games/[igdbId].ts` — read game from cache; if missing, fetch from IGDB once, cache, then return.
- Frontend: `src/lib/igdb/search.ts` wrapper, `useApi()` adds Clerk JWT.
- Components: `StarRating` (5 stars, half-star, click-to-rate), `StatusBadge`, `GameCard`.
- `AddGameModal` — debounced IGDB search → pick → status segment + half-star rating + notes → POSTs to `/api/user-games`.
- Library page rewrite: status segment header (All / Backlog / Playing / Played / Dropped), sort dropdown (Recent / Rating / Name), pull-to-refresh, FAB to open AddGameModal, empty state with CTA.
- GameDetail page at `/tabs/library/g/:igdbId` — hero (cover + meta), inline status segment + rating + notes editing (auto-saves on blur), summary, delete-with-confirm.

Permissions are enforced in API handlers (`requireAuth()` from `api/_lib/auth.ts` using Clerk's `authenticateRequest` with bearer token). DB-level RLS is not used — that came with Supabase, which we swapped out.

## Phase 5 — Discover + Friends + public profiles ✅

- `api/follows.ts` — GET (`?userId=X&role=following|followers`), POST `{ followingId }`, DELETE `?followingId=X`. DB constraint blocks self-follows; conflict-do-nothing makes follow idempotent.
- `api/users.ts` — username prefix search (auth required), 2-char minimum, escapes LIKE metacharacters.
- `api/users/[username].ts` — public profile: `{ profile, counts: { followers, following, gamesPlayed }, isFollowing, isSelf }`. `isFollowing` works without auth (returns false).
- `api/feed.ts` — recent `user_games` from people the caller follows, joined with `games_cache` and the actor's `profile`. Limit param.
- `api/game-friends.ts` — followees who have a given `igdbId` in their library. Flat URL to dodge the `[igdbId].ts` vs `[igdbId]/` folder collision.
- `MeContext` — single source of truth for caller's profile (was duplicated across `RequireOnboarded` and `Profile`); exposes `reload()` so onboarding-submit refreshes the gate without page reload.
- `UserListItem` component — avatar + handle row; reused on Friends and friends-played list.
- Friends page rewrite: Search / Following / Followers segment, debounced username search, optimistic follow toggle.
- Discover page rewrite: activity feed with relative timestamps, taps through to GameDetail.
- `PublicProfile` page at `/tabs/u/:username` — avatar, follower/following/games stats, follow button, top-rated games.
- GameDetail: "Friends who played this" section with their status + rating.
- Routes wired in `Tabs.tsx`; `MeProvider` wraps the router in `App.tsx`.

## Phase 6 — Tags + multi-tag filter + code-split ✅

- `api/tags.ts` — GET (caller's tags), POST (create with name validation, conflict-aware), DELETE (auth-scoped). Tag name regex allows letters / numbers / space / `_` / `-`, 1–30 chars.
- `api/user-game-tags.ts` — POST link, DELETE unlink. Verifies caller owns BOTH the user_game and the tag before allowing the link to prevent privilege escalation.
- Extended `GET /api/user-games` to include `tagIds: string[]` per row and accept `?tags=id1,id2` (AND filter via subquery).
- Extended `POST /api/user-games` to accept `tagIds: string[]` and atomically link only tags the caller owns.
- `TagChip` component (selected / unselected states with color tint, optional remove button).
- `TagPicker` component used inside the Add Game flow and the Game Detail page (chip group + inline "create tag" input).
- `ManageTagsModal` opened from the Profile tab — full CRUD list with confirm-on-delete (cascade removes tag from all linked games).
- Library: horizontally-scrolling tag filter chip strip above the list, multi-select AND filter, "Clear" affordance.
- Code-split: each tab page (`Library`, `Discover`, `Friends`, `Profile`, `GameDetail`, `PublicProfile`) is now a `React.lazy` import with `<AppLoading />` Suspense fallback. Initial bundle no longer ships the full app — tab pages download on first visit.

## Phase 7 — Full README + Capacitor mobile docs ✅

- README rewritten: feature tour, full file layout (api + src), env var table, manual Twitch credential setup, deploy story, permissions model section explaining why every mutation goes through `requireAuth`, architectural notes capturing the gotchas (`.js` extensions for ESM, why DB lives in `api/_lib/`, lazy profile creation).
- Capacitor section: per-platform `npx cap add` / `cap sync` / `cap open` flow for iOS and Android, signing notes, the "after every web change" sync command, pointer to live-reload for on-device dev.
- ROADMAP — this file — kept as the per-phase changelog and architectural log. Open questions section lists what we deliberately deferred (Clerk webhook for delete, custom Clerk subdomain, denormalized activity feed).

---

## Phase 8 — IGDB editorial rails on Discover ✅

Added after the 7-phase plan to address the cold-start problem (zero friends = empty Discover feed).

- `api/_lib/igdb.ts`: `fetchRail(rail, limit)` builds three IGDB v4 queries — `popular` (released last 90 days, sort by `total_rating_count`), `upcoming` (future release, sort by `hypes`), `top` (all-time top rated with significant rating volume).
- `api/igdb-search.ts` extended to handle `?rail=popular|upcoming|top` — same function, no new Vercel slot used (we're at the Hobby 12 cap).
- `src/lib/igdb/search.ts`: `fetchRail()` frontend wrapper.
- `GameRail` component: horizontal scrolling cover-art carousel with skeleton loaders.
- `AddGameModal` accepts an optional `initialGame` prop and jumps straight to the add sheet when supplied.
- Discover page rewrite: three rails ("Popular this season", "Coming soon", "All-time greats") render above the friends activity feed. Tapping a tile opens AddGameModal pre-selected so the user can add it in 2 taps. Gracefully shows a "Twitch credentials not configured" notice if `/api/igdb-search` returns 503.

## Done

All 8 phases complete. Future improvements (out of original scope):

- Clerk webhook for `user.deleted` to clean up orphan profile rows
- Profile editing UI (display name, bio, avatar upload)
- Notification when someone follows you
- Per-tag color picker
- Drag-to-reorder ranked lists ("my top 10 RPGs")
- Activity feed denormalization once feed performance starts to suffer (~100k user_games or so)
- Custom Clerk subdomain (paid Clerk plan) to remove the Clerk branding on the auth pages

---

## Open architectural questions to revisit

- Activity feed: cheap path is `select recent user_games where user_id in (followed)`. If feed performance starts to suffer, denormalize to an `activity` table written to from API routes. Defer until measured.
- Whether to allow global tag suggestions (autocomplete from popular tags across all users) vs. strictly per-user. Currently per-user only.
- Clerk free tier ships a Clerk-branded login page. Custom subdomain costs money — accepting the default for now.
- Whether to add a Clerk webhook (`user.deleted`) for cleanup. Currently profiles cascade-delete only when triggered by API call; Clerk-side deletion would orphan rows.
