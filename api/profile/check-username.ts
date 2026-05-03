import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from 'drizzle-orm';
import { db } from '../../src/lib/db/client';
import { profiles } from '../../src/lib/db/schema';
import { requireAuth, setCors } from '../_lib/auth';

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });

  const user = await requireAuth(req, res);
  if (!user) return;

  const u = String(req.query.u ?? '').trim().toLowerCase();
  if (!USERNAME_RE.test(u))
    return res.status(200).json({ available: false, reason: 'invalid_format' });

  const rows = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(sql`lower(${profiles.username}) = ${u}`)
    .limit(1);

  if (rows.length === 0) return res.status(200).json({ available: true });
  if (rows[0].id === user.userId) return res.status(200).json({ available: true, self: true });
  return res.status(200).json({ available: false, reason: 'taken' });
}
