import type { VercelRequest, VercelResponse } from '@vercel/node';
import { and, eq } from 'drizzle-orm';
import { db } from '../_lib/db.js';
import { userGames, userGameTags } from '../_lib/schema.js';
import { requireAuth, setCors } from '../_lib/auth.js';

const STATUSES = ['backlog', 'playing', 'played', 'dropped', 'wishlist'] as const;
type Status = (typeof STATUSES)[number];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const me = await requireAuth(req, res);
  if (!me) return;

  // req.query.id is set by Vercel's file routing and by server.ts for Express.
  // Fall back to req.params.id (Express route param) in case the query merge failed.
  const id = String(req.query.id ?? (req as any).params?.id ?? '');
  if (!id) return res.status(400).json({ error: 'missing_id' });

  if (req.method === 'PATCH') return handlePatch(req, res, me.userId, id);
  if (req.method === 'DELETE') return handleDelete(res, me.userId, id);
  return res.status(405).json({ error: 'method_not_allowed' });
}

async function handlePatch(req: VercelRequest, res: VercelResponse, userId: string, id: string) {
  const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) ?? {};

  const patch: Record<string, unknown> = { updatedAt: new Date() };

  if (body.status !== undefined) {
    if (!(STATUSES as readonly string[]).includes(body.status))
      return res.status(400).json({ error: 'invalid_status' });
    patch.status = body.status as Status;
  }
  if (body.rating !== undefined) {
    if (body.rating === null) patch.rating = null;
    else {
      const n = Number(body.rating);
      if (!Number.isFinite(n) || n < 0.5 || n > 10)
        return res.status(400).json({ error: 'invalid_rating' });
      patch.rating = String(n);
    }
  }
  if (body.playedOn !== undefined)
    patch.playedOn = body.playedOn ? String(body.playedOn) : null;
  if (body.notes !== undefined) patch.notes = body.notes ? String(body.notes) : null;
  if (body.playedAt !== undefined) patch.playedAt = body.playedAt || null;

  try {
    const [updated] = await db
      .update(userGames)
      .set(patch)
      .where(and(eq(userGames.id, id), eq(userGames.userId, userId)))
      .returning();
    if (!updated) return res.status(404).json({ error: 'not_found' });
    return res.status(200).json({ userGame: updated });
  } catch (err) {
    console.error('[user-games/patch]', err);
    return res.status(500).json({ error: 'internal_error', detail: String(err) });
  }
}

async function handleDelete(res: VercelResponse, userId: string, id: string) {
  try {
    // Verify ownership first
    const [game] = await db
      .select({ id: userGames.id })
      .from(userGames)
      .where(and(eq(userGames.id, id), eq(userGames.userId, userId)))
      .limit(1);
    if (!game) return res.status(404).json({ error: 'not_found' });

    // Explicitly delete tags before the game row — guards against databases where
    // the ON DELETE CASCADE migration hasn't been applied.
    await db.delete(userGameTags).where(eq(userGameTags.userGameId, id));
    await db.delete(userGames).where(eq(userGames.id, id));

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[user-games/delete]', err);
    return res.status(500).json({ error: 'internal_error', detail: String(err) });
  }
}
