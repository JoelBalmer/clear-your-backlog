import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from 'drizzle-orm';
import { db } from './_lib/db.js';
import { profiles } from './_lib/schema.js';
import { requireAuth, setCors } from './_lib/auth.js';

// GET /api/users?q=foo  — username prefix search (caller must be authed)
export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });

  const me = await requireAuth(req, res);
  if (!me) return;

  const q = String(req.query.q ?? '').trim().toLowerCase();
  if (q.length < 2) return res.status(200).json({ items: [] });

  const pattern = `${q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
  const rows = await db
    .select()
    .from(profiles)
    .where(sql`lower(${profiles.username}) like ${pattern}`)
    .limit(20);

  return res.status(200).json({ items: rows });
}
