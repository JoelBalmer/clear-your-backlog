import type { VercelRequest, VercelResponse } from '@vercel/node';
import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from './_lib/db.js';
import { gamesCache, userGames } from './_lib/schema.js';
import { requireAuth, setCors } from './_lib/auth.js';

const STATUSES = ['backlog', 'playing', 'played', 'dropped'] as const;
type Status = (typeof STATUSES)[number];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method === 'GET') return handleList(req, res);
  if (req.method === 'POST') return handleCreate(req, res);
  return res.status(405).json({ error: 'method_not_allowed' });
}

async function handleList(req: VercelRequest, res: VercelResponse) {
  const userIdParam = req.query.userId ? String(req.query.userId) : null;
  const status = req.query.status ? String(req.query.status) : null;
  const sort = String(req.query.sort ?? 'recent');

  // If no userId provided, default to caller's own library (requires auth).
  let targetUserId = userIdParam;
  if (!targetUserId) {
    const me = await requireAuth(req, res);
    if (!me) return;
    targetUserId = me.userId;
  }

  const conditions = [eq(userGames.userId, targetUserId)];
  if (status && (STATUSES as readonly string[]).includes(status)) {
    conditions.push(eq(userGames.status, status));
  }

  let orderBy;
  if (sort === 'rating') orderBy = sql`${userGames.rating} desc nulls last`;
  else if (sort === 'name') orderBy = sql`${gamesCache.name} asc`;
  else orderBy = desc(userGames.updatedAt);

  const rows = await db
    .select({
      userGame: userGames,
      game: gamesCache,
    })
    .from(userGames)
    .innerJoin(gamesCache, eq(userGames.igdbId, gamesCache.igdbId))
    .where(and(...conditions))
    .orderBy(orderBy);

  return res.status(200).json({ items: rows });
}

async function handleCreate(req: VercelRequest, res: VercelResponse) {
  const me = await requireAuth(req, res);
  if (!me) return;

  const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) ?? {};
  const igdbId = Number(body.igdbId);
  const status = String(body.status ?? '');
  const game = body.game; // { name, coverUrl, platforms, releaseYear, summary }

  if (!Number.isFinite(igdbId) || igdbId <= 0)
    return res.status(400).json({ error: 'invalid_igdb_id' });
  if (!(STATUSES as readonly string[]).includes(status))
    return res.status(400).json({ error: 'invalid_status' });
  if (!game || typeof game !== 'object' || !game.name)
    return res.status(400).json({ error: 'missing_game_metadata' });

  const rating = body.rating != null ? String(body.rating) : null;
  if (rating != null) {
    const n = Number(rating);
    if (!Number.isFinite(n) || n < 0.5 || n > 10)
      return res.status(400).json({ error: 'invalid_rating' });
  }

  await db
    .insert(gamesCache)
    .values({
      igdbId,
      name: String(game.name),
      coverUrl: game.coverUrl ? String(game.coverUrl) : null,
      platforms: Array.isArray(game.platforms) ? game.platforms.map(String) : null,
      releaseYear: game.releaseYear != null ? Number(game.releaseYear) : null,
      summary: game.summary ? String(game.summary) : null,
    })
    .onConflictDoUpdate({
      target: gamesCache.igdbId,
      set: {
        name: String(game.name),
        coverUrl: game.coverUrl ? String(game.coverUrl) : null,
        platforms: Array.isArray(game.platforms) ? game.platforms.map(String) : null,
        releaseYear: game.releaseYear != null ? Number(game.releaseYear) : null,
        summary: game.summary ? String(game.summary) : null,
        cachedAt: new Date(),
      },
    });

  try {
    const [created] = await db
      .insert(userGames)
      .values({
        userId: me.userId,
        igdbId,
        status: status as Status,
        rating,
        playedOn: body.playedOn ? String(body.playedOn) : null,
        notes: body.notes ? String(body.notes) : null,
      })
      .returning();
    return res.status(201).json({ userGame: created });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('user_games_user_igdb_unique'))
      return res.status(409).json({ error: 'already_in_library' });
    console.error('[user-games] insert failed:', msg);
    return res.status(500).json({ error: 'insert_failed', detail: msg });
  }
}
