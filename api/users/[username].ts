import type { VercelRequest, VercelResponse } from '@vercel/node';
import { and, count, eq, sql } from 'drizzle-orm';
import { db } from '../_lib/db.js';
import { follows, profiles, userGames } from '../_lib/schema.js';
import { getAuthedUser, setCors } from '../_lib/auth.js';

// GET /api/users/:username
//   -> { profile, counts: { followers, following, gamesPlayed }, isFollowing, isSelf }
export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });

  const username = String(req.query.username ?? '').toLowerCase();
  if (!username) return res.status(400).json({ error: 'missing_username' });

  const [profile] = await db
    .select()
    .from(profiles)
    .where(sql`lower(${profiles.username}) = ${username}`)
    .limit(1);
  if (!profile) return res.status(404).json({ error: 'not_found' });

  const [followersRow] = await db
    .select({ n: count() })
    .from(follows)
    .where(eq(follows.followingId, profile.id));
  const [followingRow] = await db
    .select({ n: count() })
    .from(follows)
    .where(eq(follows.followerId, profile.id));
  const [gamesRow] = await db
    .select({ n: count() })
    .from(userGames)
    .where(eq(userGames.userId, profile.id));

  const counts = {
    followers: Number(followersRow?.n ?? 0),
    following: Number(followingRow?.n ?? 0),
    gamesPlayed: Number(gamesRow?.n ?? 0),
  };

  // isFollowing requires auth (best-effort; not an error if anonymous)
  const auth = await getAuthedUser(req);
  let isFollowing = false;
  let isSelf = false;
  if ('user' in auth) {
    isSelf = auth.user.userId === profile.id;
    if (!isSelf) {
      const [row] = await db
        .select({ id: follows.followerId })
        .from(follows)
        .where(and(eq(follows.followerId, auth.user.userId), eq(follows.followingId, profile.id)))
        .limit(1);
      isFollowing = !!row;
    }
  }

  return res.status(200).json({ profile, counts, isFollowing, isSelf });
}
