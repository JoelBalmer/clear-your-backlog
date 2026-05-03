import type { VercelRequest, VercelResponse } from '@vercel/node';
import { and, eq, ne, sql } from 'drizzle-orm';
import { db } from './_lib/db.js';
import { profiles } from './_lib/schema.js';
import { requireAuth, setCors } from './_lib/auth.js';

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST' && req.method !== 'PATCH')
    return res.status(405).json({ error: 'method_not_allowed' });

  const user = await requireAuth(req, res);
  if (!user) return;

  const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) ?? {};
  const username = String(body.username ?? '').trim().toLowerCase();
  const displayName = body.displayName ? String(body.displayName).trim() : null;
  const bio = body.bio ? String(body.bio).trim() : null;
  const avatarUrl = body.avatarUrl ? String(body.avatarUrl).trim() : null;

  if (!USERNAME_RE.test(username))
    return res.status(400).json({ error: 'invalid_username', message: '3-20 chars: a-z, 0-9, _' });

  const taken = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(and(sql`lower(${profiles.username}) = ${username}`, ne(profiles.id, user.userId)))
    .limit(1);
  if (taken.length) return res.status(409).json({ error: 'username_taken' });

  const [existing] = await db.select().from(profiles).where(eq(profiles.id, user.userId)).limit(1);

  if (!existing) {
    const [created] = await db
      .insert(profiles)
      .values({ id: user.userId, username, displayName, bio, avatarUrl })
      .returning();
    return res.status(201).json({ profile: created });
  }

  const [updated] = await db
    .update(profiles)
    .set({ username, displayName, bio, avatarUrl })
    .where(eq(profiles.id, user.userId))
    .returning();
  return res.status(200).json({ profile: updated });
}
