import type { VercelRequest, VercelResponse } from '@vercel/node';
import { desc, eq, inArray } from 'drizzle-orm';
import { db } from './_lib/db.js';
import { follows, gamesCache, profiles, userGames } from './_lib/schema.js';
import { requireAuth, setCors } from './_lib/auth.js';

// GET /api/feed?limit=50
// Recent activity from people the caller follows.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });

  const me = await requireAuth(req, res);
  if (!me) return;

  const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 50)));

  const followingRows = await db
    .select({ id: follows.followingId })
    .from(follows)
    .where(eq(follows.followerId, me.userId));
  const followingIds = followingRows.map((r) => r.id);
  if (followingIds.length === 0) return res.status(200).json({ items: [] });

  const items = await db
    .select({ userGame: userGames, game: gamesCache, actor: profiles })
    .from(userGames)
    .innerJoin(gamesCache, eq(userGames.igdbId, gamesCache.igdbId))
    .innerJoin(profiles, eq(userGames.userId, profiles.id))
    .where(inArray(userGames.userId, followingIds))
    .orderBy(desc(userGames.updatedAt))
    .limit(limit);

  return res.status(200).json({ items });
}
