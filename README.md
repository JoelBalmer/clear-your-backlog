# Clear Your Backlog

Personal game rating + social app. Track what you've played, rate it, share lists with friends.

## Stack

- **Frontend:** Ionic + Capacitor + React + TypeScript + Vite
- **Backend:** Supabase (Postgres + Auth + RLS)
- **IGDB proxy:** Vercel Serverless Function (`/api/igdb-search`)
- **Hosting:** Vercel (auto-deploy from `main`, PR previews)
- **CI:** GitHub Actions (typecheck + lint on PRs)

## Local setup

```bash
npm install
cp .env.example .env
# fill in Supabase + Twitch creds (see "Credentials" below)
npm run dev
```

## Deploy

- Push to `main` → Vercel auto-deploys to prod
- Open a PR → Vercel posts a preview URL
- CI runs `tsc --noEmit` + `npm run lint` on every PR

To set Vercel env vars (after Phase 4):
```bash
vercel env add TWITCH_CLIENT_ID
vercel env add TWITCH_CLIENT_SECRET
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```

## Credentials

- **Supabase** — create a project at supabase.com, copy URL + anon key from Settings → API
- **Twitch / IGDB** — register an app at dev.twitch.tv, copy Client ID + Client Secret

## Mobile builds (later)

Native iOS/Android targets are not added yet. To add them:
```bash
npx cap add ios
npx cap add android
npm run build && npx cap sync
npx cap open ios     # or android
```

## Status

Phase 1 (scaffold + deploy infrastructure) complete. Phases 2–7 (schema, auth, IGDB proxy, screens, components, full README) pending.
