import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth, setCors } from './_lib/auth';
import { searchIgdb } from './_lib/igdb';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });

  const user = await requireAuth(req, res);
  if (!user) return;

  const q = String(req.query.q ?? '').trim();
  if (!q) return res.status(200).json({ results: [] });

  try {
    const results = await searchIgdb(q);
    return res.status(200).json({ results });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'igdb_failed';
    const code = msg.includes('credentials not configured') ? 503 : 502;
    return res.status(code).json({ error: 'igdb_failed', message: msg });
  }
}
