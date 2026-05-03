import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth, setCors } from './_lib/auth.js';
import { fetchRail, searchIgdb, type Rail } from './_lib/igdb.js';

const VALID_RAILS: Rail[] = ['popular', 'upcoming', 'top'];

// GET /api/igdb-search?q=zelda      -> search results
// GET /api/igdb-search?rail=popular -> editorial rail (popular | upcoming | top)
export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });

  const user = await requireAuth(req, res);
  if (!user) return;

  const railParam = req.query.rail ? String(req.query.rail) : null;
  if (railParam) {
    if (!VALID_RAILS.includes(railParam as Rail))
      return res.status(400).json({ error: 'invalid_rail' });
    try {
      const results = await fetchRail(railParam as Rail);
      return res.status(200).json({ results });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'igdb_failed';
      const code = msg.includes('credentials not configured') ? 503 : 502;
      return res.status(code).json({ error: 'igdb_failed', message: msg });
    }
  }

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
