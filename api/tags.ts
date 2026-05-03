import type { VercelRequest, VercelResponse } from '@vercel/node';
import { and, eq } from 'drizzle-orm';
import { db } from './_lib/db.js';
import { tags } from './_lib/schema.js';
import { requireAuth, setCors } from './_lib/auth.js';

const NAME_RE = /^[\p{L}\p{N} _-]{1,30}$/u;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const me = await requireAuth(req, res);
  if (!me) return;

  if (req.method === 'GET') {
    const rows = await db.select().from(tags).where(eq(tags.userId, me.userId));
    return res.status(200).json({ items: rows });
  }

  if (req.method === 'POST') {
    const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) ?? {};
    const name = String(body.name ?? '').trim();
    const color = body.color ? String(body.color).trim() : null;
    if (!NAME_RE.test(name))
      return res.status(400).json({ error: 'invalid_name', message: '1-30 chars: letters, numbers, space, _, -' });
    try {
      const [created] = await db
        .insert(tags)
        .values({ userId: me.userId, name, color })
        .returning();
      return res.status(201).json({ tag: created });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('tags_user_name_unique'))
        return res.status(409).json({ error: 'tag_exists' });
      console.error('[tags] insert failed:', msg);
      return res.status(500).json({ error: 'insert_failed', detail: msg });
    }
  }

  if (req.method === 'DELETE') {
    const id = String(req.query.id ?? '');
    if (!id) return res.status(400).json({ error: 'missing_id' });
    const [deleted] = await db
      .delete(tags)
      .where(and(eq(tags.id, id), eq(tags.userId, me.userId)))
      .returning();
    if (!deleted) return res.status(404).json({ error: 'not_found' });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'method_not_allowed' });
}
