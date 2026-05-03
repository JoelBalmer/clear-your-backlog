import type { VercelRequest, VercelResponse } from '@vercel/node';
import { and, eq } from 'drizzle-orm';
import { db } from './_lib/db.js';
import { tags, userGameTags, userGames } from './_lib/schema.js';
import { requireAuth, setCors } from './_lib/auth.js';

// Verifies that the caller owns both the user_game and the tag
// before allowing link/unlink.
async function verifyOwnership(
  callerId: string,
  userGameId: string,
  tagId: string,
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const [ug] = await db
    .select({ userId: userGames.userId })
    .from(userGames)
    .where(eq(userGames.id, userGameId))
    .limit(1);
  if (!ug) return { ok: false, status: 404, error: 'user_game_not_found' };
  if (ug.userId !== callerId) return { ok: false, status: 403, error: 'forbidden' };

  const [t] = await db.select({ userId: tags.userId }).from(tags).where(eq(tags.id, tagId)).limit(1);
  if (!t) return { ok: false, status: 404, error: 'tag_not_found' };
  if (t.userId !== callerId) return { ok: false, status: 403, error: 'forbidden' };

  return { ok: true };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const me = await requireAuth(req, res);
  if (!me) return;

  if (req.method === 'POST') {
    const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) ?? {};
    const userGameId = String(body.userGameId ?? '');
    const tagId = String(body.tagId ?? '');
    if (!userGameId || !tagId) return res.status(400).json({ error: 'missing_ids' });
    const ownership = await verifyOwnership(me.userId, userGameId, tagId);
    if (!ownership.ok) return res.status(ownership.status).json({ error: ownership.error });
    await db.insert(userGameTags).values({ userGameId, tagId }).onConflictDoNothing();
    return res.status(201).json({ ok: true });
  }

  if (req.method === 'DELETE') {
    const userGameId = String(req.query.userGameId ?? '');
    const tagId = String(req.query.tagId ?? '');
    if (!userGameId || !tagId) return res.status(400).json({ error: 'missing_ids' });
    const ownership = await verifyOwnership(me.userId, userGameId, tagId);
    if (!ownership.ok) return res.status(ownership.status).json({ error: ownership.error });
    await db
      .delete(userGameTags)
      .where(and(eq(userGameTags.userGameId, userGameId), eq(userGameTags.tagId, tagId)));
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'method_not_allowed' });
}
