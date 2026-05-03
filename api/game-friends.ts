import type { VercelRequest, VercelResponse } from '@vercel/node';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { db } from './_lib/db.js';
import { follows, profiles, userGames } from './_lib/schema.js';
import { requireAuth, setCors } from './_lib/auth.js';

// GET /api/game-friends?igdbId=X
// People the caller follows who have this game in their library.
// (Flat URL to avoid the [igdbId].ts vs [igdbId]/ folder routing collision.)
export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });

  const me = await requireAuth(req, res);
  if (!me) return;

  const igdbId = Number(req.query.igdbId);
  if (!Number.isFinite(igdbId) || igdbId <= 0)
    return res.status(400).json({ error: 'invalid_igdb_id' });

  const followingRows = await db
    .select({ id: follows.followingId })
    .from(follows)
    .where(eq(follows.followerId, me.userId));
  const followingIds = followingRows.map((r) => r.id);
  if (followingIds.length === 0) return res.status(200).json({ items: [] });

  const items = await db
    .select({ profile: profiles, userGame: userGames })
    .from(userGames)
    .innerJoin(profiles, eq(userGames.userId, profiles.id))
    .where(and(eq(userGames.igdbId, igdbId), inArray(userGames.userId, followingIds)))
    .orderBy(sql`${userGames.rating} desc nulls last`, desc(userGames.updatedAt));

  return res.status(200).json({ items });
}
