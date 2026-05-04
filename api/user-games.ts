import type { VercelRequest, VercelResponse } from '@vercel/node';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { db } from './_lib/db.js';
import { gamesCache, tags, userGameTags, userGames } from './_lib/schema.js';
import { requireAuth, setCors } from './_lib/auth.js';

const STATUSES = ['backlog', 'playing', 'played', 'dropped', 'wishlist'] as const;
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
  // status param: comma-separated list of statuses; OR-filter (any match).
  // Single string still works for backwards compatibility.
  const statusFilter = req.query.status
    ? String(req.query.status)
        .split(',')
        .map((s: string) => s.trim())
        .filter((s: string) => (STATUSES as readonly string[]).includes(s))
    : [];
  const sort = String(req.query.sort ?? 'recent');
  // tags param: comma-separated tag IDs; matches games that have ALL of them (AND).
  const tagFilter = req.query.tags
    ? String(req.query.tags).split(',').map((s: string) => s.trim()).filter(Boolean)
    : [];

  // If no userId provided, default to caller's own library (requires auth).
  let targetUserId = userIdParam;
  if (!targetUserId) {
    const me = await requireAuth(req, res);
    if (!me) return;
    targetUserId = me.userId;
  }

  const conditions = [eq(userGames.userId, targetUserId)];
  if (statusFilter.length > 0) {
    conditions.push(inArray(userGames.status, statusFilter));
  }

  // AND-filter on tags: subquery returns user_game_ids that have all the requested tags.
  if (tagFilter.length > 0) {
    const matchingIds = db
      .select({ userGameId: userGameTags.userGameId })
      .from(userGameTags)
      .where(inArray(userGameTags.tagId, tagFilter))
      .groupBy(userGameTags.userGameId)
      .having(sql`count(distinct ${userGameTags.tagId}) = ${tagFilter.length}`);
    conditions.push(inArray(userGames.id, matchingIds));
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

  // Fetch tag IDs per user_game in one extra query, then group client-side.
  const ids = rows.map((r) => r.userGame.id);
  const tagLinks =
    ids.length === 0
      ? []
      : await db
          .select({ userGameId: userGameTags.userGameId, tagId: userGameTags.tagId })
          .from(userGameTags)
          .where(inArray(userGameTags.userGameId, ids));
  const tagsByUserGame = new Map<string, string[]>();
  for (const link of tagLinks) {
    if (!tagsByUserGame.has(link.userGameId)) tagsByUserGame.set(link.userGameId, []);
    tagsByUserGame.get(link.userGameId)!.push(link.tagId);
  }
  const items = rows.map((r) => ({
    ...r,
    tagIds: tagsByUserGame.get(r.userGame.id) ?? [],
  }));

  return res.status(200).json({ items });
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

    // Link any tags provided in the same request, but only ones the caller owns.
    const requestedTagIds: string[] = Array.isArray(body.tagIds)
      ? body.tagIds.map((x: unknown) => String(x)).filter(Boolean)
      : [];
    if (requestedTagIds.length > 0) {
      const ownedTags = await db
        .select({ id: tags.id })
        .from(tags)
        .where(and(eq(tags.userId, me.userId), inArray(tags.id, requestedTagIds)));
      const ownedSet = new Set(ownedTags.map((t) => t.id));
      const validIds = requestedTagIds.filter((id: string) => ownedSet.has(id));
      if (validIds.length > 0) {
        await db
          .insert(userGameTags)
          .values(validIds.map((tagId: string) => ({ userGameId: created.id, tagId })))
          .onConflictDoNothing();
      }
    }

    return res.status(201).json({ userGame: created });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('user_games_user_igdb_unique'))
      return res.status(409).json({ error: 'already_in_library' });
    console.error('[user-games] insert failed:', msg);
    return res.status(500).json({ error: 'insert_failed', detail: msg });
  }
}
