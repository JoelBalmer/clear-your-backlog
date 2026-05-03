import type { VercelRequest, VercelResponse } from '@vercel/node';
import { and, desc, eq } from 'drizzle-orm';
import { db } from './_lib/db.js';
import { follows, profiles } from './_lib/schema.js';
import { requireAuth, setCors } from './_lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method === 'GET') return handleList(req, res);
  if (req.method === 'POST') return handleCreate(req, res);
  if (req.method === 'DELETE') return handleDelete(req, res);
  return res.status(405).json({ error: 'method_not_allowed' });
}

// GET /api/follows?userId=X&role=following|followers
//   role=following  -> who X follows
//   role=followers  -> who follows X
async function handleList(req: VercelRequest, res: VercelResponse) {
  const userId = String(req.query.userId ?? '');
  const role = String(req.query.role ?? 'following');
  if (!userId) return res.status(400).json({ error: 'missing_user_id' });

  if (role === 'following') {
    const rows = await db
      .select({ profile: profiles, since: follows.createdAt })
      .from(follows)
      .innerJoin(profiles, eq(follows.followingId, profiles.id))
      .where(eq(follows.followerId, userId))
      .orderBy(desc(follows.createdAt));
    return res.status(200).json({ items: rows });
  }
  if (role === 'followers') {
    const rows = await db
      .select({ profile: profiles, since: follows.createdAt })
      .from(follows)
      .innerJoin(profiles, eq(follows.followerId, profiles.id))
      .where(eq(follows.followingId, userId))
      .orderBy(desc(follows.createdAt));
    return res.status(200).json({ items: rows });
  }
  return res.status(400).json({ error: 'invalid_role' });
}

async function handleCreate(req: VercelRequest, res: VercelResponse) {
  const me = await requireAuth(req, res);
  if (!me) return;
  const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) ?? {};
  const followingId = String(body.followingId ?? '');
  if (!followingId) return res.status(400).json({ error: 'missing_following_id' });
  if (followingId === me.userId) return res.status(400).json({ error: 'cannot_follow_self' });

  try {
    await db
      .insert(follows)
      .values({ followerId: me.userId, followingId })
      .onConflictDoNothing();
    return res.status(201).json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[follows] insert failed:', msg);
    if (msg.includes('foreign key')) return res.status(404).json({ error: 'user_not_found' });
    return res.status(500).json({ error: 'insert_failed', detail: msg });
  }
}

async function handleDelete(req: VercelRequest, res: VercelResponse) {
  const me = await requireAuth(req, res);
  if (!me) return;
  const followingId = String(req.query.followingId ?? '');
  if (!followingId) return res.status(400).json({ error: 'missing_following_id' });
  await db
    .delete(follows)
    .where(and(eq(follows.followerId, me.userId), eq(follows.followingId, followingId)));
  return res.status(200).json({ ok: true });
}
